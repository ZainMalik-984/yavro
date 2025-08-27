from sqlalchemy.orm import Session
from app import models
from app import schemas
import numpy as np
import face_recognition
from datetime import datetime
import random


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users with pagination"""
    return db.query(models.User).offset(skip).limit(limit).all()


def update_user(db: Session, user_id: int, user_data: dict):
    """Update user information"""
    user = get_user(db, user_id)
    if user:
        for key, value in user_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    """Delete a user and all associated data"""
    user = get_user(db, user_id)
    if user:
        # Delete associated visits
        db.query(models.Visit).filter(models.Visit.user_id == user_id).delete()
        # Delete associated user rewards
        db.query(models.UserReward).filter(
            models.UserReward.user_id == user_id).delete()
        # Delete the user
        db.delete(user)
        db.commit()
        return True
    return False


def get_user_by_face_encoding(db: Session, encoding: np.ndarray, tolerance: float = 0.4):
    import logging
    users = db.query(models.User).all()
    logging.info(f"Input encoding shape: {encoding.shape}")

    if not users:
        logging.info("No users in database")
        return None

    for user in users:
        try:
            # Convert stored encoding back to numpy array
            db_encoding = np.frombuffer(user.face_encoding, dtype=np.float64)
            logging.info(
                f"DB encoding shape for user {user.id}: {db_encoding.shape}")

            # Use face_recognition's compare_faces function for proper comparison
            # This is more reliable than manual distance calculation
            matches = face_recognition.compare_faces(
                [db_encoding], encoding, tolerance=tolerance)

            if matches[0]:
                logging.info(f"Match found: user {user.id} ({user.name})")
                return user
            else:
                # Also log the distance for debugging
                distance = face_recognition.face_distance(
                    [db_encoding], encoding)[0]
                logging.info(
                    f"No match for user {user.id} ({user.name}): distance={distance}")

        except Exception as e:
            logging.error(f"Error comparing with user {user.id}: {str(e)}")
            continue

    logging.info("No match found for any user.")
    return None


def create_user(db: Session, user: schemas.UserCreate, face_encoding: np.ndarray):
    db_user = models.User(
        name=user.name,
        email=user.email,
        address=user.address,
        phone_number=user.phone_number,
        face_encoding=face_encoding.tobytes(),
        visit_count=0,
        current_tier=1
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_visit(db: Session, user_id: int):
    """Create a new visit for a user and increment their visit count"""
    # Create the visit record
    db_visit = models.Visit(
        user_id=user_id,
        visit_datetime=datetime.utcnow()
    )
    db.add(db_visit)

    # Increment user's visit count
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.visit_count += 1

    db.commit()
    db.refresh(db_visit)
    db.refresh(user)

    return db_visit, user


def get_user_visits(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get all visits for a specific user"""
    return db.query(models.Visit).filter(models.Visit.user_id == user_id).offset(skip).limit(limit).all()


def get_visit(db: Session, visit_id: int):
    """Get a specific visit by ID"""
    return db.query(models.Visit).filter(models.Visit.id == visit_id).first()

# Tier CRUD operations


def get_tier(db: Session, tier_id: int):
    return db.query(models.Tier).filter(models.Tier.id == tier_id).first()


def get_tier_by_visit_requirement(db: Session, visit_requirement: int):
    return db.query(models.Tier).filter(models.Tier.visit_requirement == visit_requirement).first()


def get_tiers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Tier).filter(models.Tier.is_active == True).offset(skip).limit(limit).all()


def create_tier(db: Session, tier: schemas.TierCreate):
    db_tier = models.Tier(**tier.dict())
    db.add(db_tier)
    db.commit()
    db.refresh(db_tier)
    return db_tier


def update_tier(db: Session, tier_id: int, tier: schemas.TierCreate):
    db_tier = db.query(models.Tier).filter(models.Tier.id == tier_id).first()
    if db_tier:
        for key, value in tier.dict().items():
            setattr(db_tier, key, value)
        db.commit()
        db.refresh(db_tier)
    return db_tier


def delete_tier(db: Session, tier_id: int):
    db_tier = db.query(models.Tier).filter(models.Tier.id == tier_id).first()
    if db_tier:
        db.delete(db_tier)
        db.commit()
    return db_tier

# Reward CRUD operations


def get_reward(db: Session, reward_id: int):
    return db.query(models.Reward).filter(models.Reward.id == reward_id).first()


def get_rewards_by_tier(db: Session, tier_id: int):
    return db.query(models.Reward).filter(models.Reward.tier_id == tier_id, models.Reward.is_active == True).all()


def get_rewards(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Reward).filter(models.Reward.is_active == True).offset(skip).limit(limit).all()


def create_reward(db: Session, reward: schemas.RewardCreate):
    db_reward = models.Reward(**reward.dict())
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward


def update_reward(db: Session, reward_id: int, reward: schemas.RewardCreate):
    db_reward = db.query(models.Reward).filter(
        models.Reward.id == reward_id).first()
    if db_reward:
        for key, value in reward.dict().items():
            setattr(db_reward, key, value)
        db.commit()
        db.refresh(db_reward)
    return db_reward


def delete_reward(db: Session, reward_id: int):
    db_reward = db.query(models.Reward).filter(
        models.Reward.id == reward_id).first()
    if db_reward:
        db.delete(db_reward)
        db.commit()
    return db_reward

# Spinner Option CRUD operations


def get_spinner_option(db: Session, option_id: int):
    return db.query(models.SpinnerOption).filter(models.SpinnerOption.id == option_id).first()


def get_spinner_options_by_reward(db: Session, reward_id: int):
    return db.query(models.SpinnerOption).filter(models.SpinnerOption.reward_id == reward_id, models.SpinnerOption.is_active == True).all()


def create_spinner_option(db: Session, option: schemas.SpinnerOptionCreate, reward_id: int):
    db_option = models.SpinnerOption(**option.dict(), reward_id=reward_id)
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    return db_option


def update_spinner_option(db: Session, option_id: int, option: schemas.SpinnerOptionCreate):
    db_option = db.query(models.SpinnerOption).filter(
        models.SpinnerOption.id == option_id).first()
    if db_option:
        for key, value in option.dict().items():
            setattr(db_option, key, value)
        db.commit()
        db.refresh(db_option)
    return db_option


def delete_spinner_option(db: Session, option_id: int):
    db_option = db.query(models.SpinnerOption).filter(
        models.SpinnerOption.id == option_id).first()
    if db_option:
        db.delete(db_option)
        db.commit()
    return db_option

# User Reward CRUD operations


def get_user_rewards(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.UserReward).filter(models.UserReward.user_id == user_id).offset(skip).limit(limit).all()


def create_user_reward(db: Session, user_reward: schemas.UserRewardCreate):
    db_user_reward = models.UserReward(**user_reward.dict())
    db.add(db_user_reward)
    db.commit()
    db.refresh(db_user_reward)
    return db_user_reward


def update_user_reward_usage(db: Session, user_reward_id: int):
    db_user_reward = db.query(models.UserReward).filter(
        models.UserReward.id == user_reward_id).first()
    if db_user_reward:
        db_user_reward.is_used = True
        db_user_reward.used_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user_reward)
    return db_user_reward

# Reward system logic


def check_tier_upgrade(db: Session, user_id: int):
    """Check if user should be upgraded to a higher tier based on visit count"""
    user = get_user(db, user_id)
    if not user:
        return None

    # Get all active tiers ordered by visit requirement
    tiers = db.query(models.Tier).filter(models.Tier.is_active == True).order_by(
        models.Tier.visit_requirement).all()

    new_tier = user.current_tier
    for tier in tiers:
        if user.visit_count >= tier.visit_requirement:
            new_tier = tier.visit_requirement

    if new_tier != user.current_tier:
        user.current_tier = new_tier
        db.commit()
        db.refresh(user)

    return user


def check_multiple_based_reward(db: Session, user_id: int, visit_count: int):
    """Check if user should get a reward based on multiples of tier visit requirements"""
    user = get_user(db, user_id)
    if not user:
        return None

    # Get all active tiers ordered by visit requirement (highest first for priority)
    tiers = db.query(models.Tier).filter(models.Tier.is_active == True).order_by(
        models.Tier.visit_requirement.desc()).all()

    # Check each tier to see if the current visit count is a multiple of the tier's requirement
    # Return the highest tier that matches (highest priority)
    for tier in tiers:
        if visit_count % tier.visit_requirement == 0:
            # User has reached a multiple of this tier's requirement
            rewards = get_rewards_by_tier(db, tier.id)
            if rewards:
                # Return the first active reward for this tier
                return rewards[0], tier

    return None, None


def check_all_multiple_based_rewards(db: Session, user_id: int, visit_count: int):
    """Check if user should get rewards based on multiples of tier visit requirements - returns ALL matching rewards"""
    user = get_user(db, user_id)
    if not user:
        return []

    # Get all active tiers ordered by visit requirement (highest first for priority)
    tiers = db.query(models.Tier).filter(models.Tier.is_active == True).order_by(
        models.Tier.visit_requirement.desc()).all()

    matching_rewards = []

    # Check each tier to see if the current visit count is a multiple of the tier's requirement
    for tier in tiers:
        if visit_count % tier.visit_requirement == 0:
            # User has reached a multiple of this tier's requirement
            rewards = get_rewards_by_tier(db, tier.id)
            if rewards:
                matching_rewards.append((rewards[0], tier))

    return matching_rewards


def get_eligible_reward(db: Session, user_id: int):
    """Get the reward that should be given to a user based on their current tier"""
    user = get_user(db, user_id)
    if not user:
        return None

    # Find the tier that matches the user's current tier level
    tier = get_tier_by_visit_requirement(db, user.current_tier)
    if not tier:
        return None

    # Get rewards for this tier
    rewards = get_rewards_by_tier(db, tier.id)
    if not rewards:
        return None

    # For now, return the first active reward
    # In the future, you could implement more complex logic here
    return rewards[0] if rewards else None


def spin_reward(db: Session, reward_id: int):
    """Spin the reward wheel and return a random spinner option"""
    spinner_options = get_spinner_options_by_reward(db, reward_id)
    if not spinner_options:
        return None

    # Create a weighted random selection based on probability
    options = []
    weights = []
    for option in spinner_options:
        options.append(option)
        weights.append(option.probability)

    if not options:
        return None

    # Use random.choices for weighted selection
    selected_option = random.choices(options, weights=weights, k=1)[0]
    return selected_option
