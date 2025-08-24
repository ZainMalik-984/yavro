
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, crud, database
import face_recognition
import numpy as np
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000"],  # Allow React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/frontend", StaticFiles(directory="../frontend", html=True), name="frontend")

def get_face_encoding(file: UploadFile) -> np.ndarray:
    import logging
    try:
        # Reset file pointer to beginning
        file.file.seek(0)
        
        # Load image using face_recognition
        image = face_recognition.load_image_file(file.file)
        
        # Detect face locations first
        face_locations = face_recognition.face_locations(image)
        logging.info(f"Detected {len(face_locations)} face(s) in image")
        
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in the image.")
        
        # Get face encodings
        encodings = face_recognition.face_encodings(image, face_locations)
        
        if not encodings:
            raise HTTPException(status_code=400, detail="Could not encode face features.")
        
        # If multiple faces detected, use the first one
        if len(encodings) > 1:
            logging.warning(f"Multiple faces detected, using the first one")
        
        encoding = encodings[0]
        logging.info(f"Face encoding shape: {encoding.shape}")
        
        return encoding
        
    except Exception as e:
        logging.error(f"Error in face encoding: {str(e)}")
        if "No face detected" in str(e):
            raise HTTPException(status_code=400, detail="No face detected in the image.")
        raise HTTPException(status_code=500, detail=f"Error processing face: {str(e)}")

@app.post("/recognize/")
def recognize_user(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    try:
        logging.info("Starting face recognition process")
        encoding = get_face_encoding(file)
        logging.info(f"Got face encoding, shape: {encoding.shape}")
        
        user = crud.get_user_by_face_encoding(db, encoding)
        if user:
            logging.info(f"User recognized: {user.name} (ID: {user.id})")
            # Return only serializable fields using Pydantic schema
            return schemas.User.from_orm(user)
        
        logging.info("No user found for the provided face")
        return JSONResponse(status_code=404, content={"detail": "User not found"})
    except Exception as e:
        logging.error(f"Error in recognize endpoint: {str(e)}")
        raise


@app.post("/register/")
def register_user(
    file: UploadFile = File(...),
    name: str = Form(...),
    email: str = Form(...),
    address: str = Form(...),
    db: Session = Depends(database.get_db)
):
    import logging
    try:
        encoding = get_face_encoding(file)
        db_user = crud.get_user_by_email(db, email=email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_data = schemas.UserCreate(name=name, email=email, address=address)
        user = crud.create_user(db=db, user=user_data, face_encoding=encoding)
        return schemas.User.from_orm(user)
    except Exception as e:
        logging.exception("Error in /register endpoint")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/checkout/{user_id}/")
def checkout_user(user_id: int, db: Session = Depends(database.get_db)):
    """Create a visit for a user and handle tier-based reward system"""
    try:
        # Check if user exists
        user = crud.get_user(db, user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create visit and update visit count
        visit, updated_user = crud.create_visit(db, user_id)
        
        # Check for tier upgrade
        updated_user = crud.check_tier_upgrade(db, user_id)
        
        # Check if this visit qualifies for a reward
        reward_earned = None
        message = f"Visit recorded successfully for {user.name}"
        
        if updated_user:
            # Check if user just reached a new tier
            tier = crud.get_tier_by_visit_requirement(db, updated_user.current_tier)
            if tier and updated_user.visit_count == tier.visit_requirement:
                # User just reached this tier, give them a reward
                reward = crud.get_eligible_reward(db, user_id)
                if reward:
                    if reward.reward_type == "spinner":
                        message += f"! 🎉 Congratulations! You've reached {tier.name} tier! Spin the wheel to get your reward!"
                        reward_earned = {
                            "type": "spinner",
                            "reward_id": reward.id,
                            "tier_name": tier.name,
                            "message": "Spin the wheel to get your reward!"
                        }
                    else:
                        # Create user reward record
                        user_reward_data = schemas.UserRewardCreate(
                            user_id=user_id,
                            reward_id=reward.id,
                            visit_id=visit.id,
                            reward_type=reward.reward_type,
                            value=reward.value
                        )
                        user_reward = crud.create_user_reward(db, user_reward_data)
                        
                        if reward.reward_type == "free_coffee":
                            message += f"! 🎉 Congratulations! You've earned a FREE COFFEE at {tier.name} tier!"
                            reward_earned = {
                                "type": "free_coffee",
                                "reward_id": reward.id,
                                "user_reward_id": user_reward.id,
                                "tier_name": tier.name,
                                "message": "Free coffee earned!"
                            }
                        elif reward.reward_type == "discount":
                            message += f"! 🎉 Congratulations! You've earned a {reward.value}% DISCOUNT at {tier.name} tier!"
                            reward_earned = {
                                "type": "discount",
                                "reward_id": reward.id,
                                "user_reward_id": user_reward.id,
                                "tier_name": tier.name,
                                "discount_percentage": reward.value,
                                "message": f"{reward.value}% discount earned!"
                            }
            else:
                # Check next tier progress
                next_tier = db.query(models.Tier).filter(
                    models.Tier.visit_requirement > updated_user.visit_count,
                    models.Tier.is_active == True
                ).order_by(models.Tier.visit_requirement).first()
                
                if next_tier:
                    visits_remaining = next_tier.visit_requirement - updated_user.visit_count
                    message += f". You need {visits_remaining} more visit{'s' if visits_remaining != 1 else ''} to reach {next_tier.name} tier."
                else:
                    message += ". You've reached the highest tier!"
        
        return schemas.CheckoutResponse(
            success=True,
            message=message,
            visit=schemas.Visit.from_orm(visit),
            user=schemas.User.from_orm(updated_user),
            reward_earned=reward_earned
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in checkout endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/spin-reward/")
def spin_reward_wheel(request: schemas.SpinnerRequest, db: Session = Depends(database.get_db)):
    """Spin the reward wheel and return a random reward"""
    try:
        # Verify user exists
        user = crud.get_user(db, request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify reward exists and is a spinner type
        reward = crud.get_reward(db, request.reward_id)
        if not reward or reward.reward_type != "spinner":
            raise HTTPException(status_code=400, detail="Invalid reward or not a spinner reward")
        
        # Spin the wheel
        selected_option = crud.spin_reward(db, request.reward_id)
        if not selected_option:
            raise HTTPException(status_code=400, detail="No spinner options available")
        
        # Create user reward record
        user_reward_data = schemas.UserRewardCreate(
            user_id=request.user_id,
            reward_id=request.reward_id,
            visit_id=request.visit_id,
            spinner_option_id=selected_option.id,
            reward_type=selected_option.reward_type,
            value=selected_option.value
        )
        user_reward = crud.create_user_reward(db, user_reward_data)
        
        message = f"🎉 Congratulations! You won: {selected_option.name}!"
        if selected_option.reward_type == "discount":
            message += f" ({selected_option.value}% discount)"
        
        return schemas.SpinnerResponse(
            success=True,
            message=message,
            selected_option=schemas.SpinnerOption.from_orm(selected_option),
            user_reward=schemas.UserReward.from_orm(user_reward)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in spin reward endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.get("/user/{user_id}")
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Return only serializable fields using Pydantic schema
    return schemas.User.from_orm(user)

@app.get("/debug/users")
def debug_users(db: Session = Depends(database.get_db)):
    """Debug endpoint to see all registered users"""
    users = db.query(models.User).all()
    return {
        "total_users": len(users),
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "visit_count": user.visit_count,
                "current_tier": user.current_tier,
                "has_face_encoding": user.face_encoding is not None,
                "encoding_size": len(user.face_encoding) if user.face_encoding else 0
            }
            for user in users
        ]
    }

# Tier management endpoints
@app.get("/tiers/")
def get_tiers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all active tiers"""
    tiers = crud.get_tiers(db, skip=skip, limit=limit)
    return [schemas.Tier.from_orm(tier) for tier in tiers]

@app.post("/tiers/")
def create_tier(tier: schemas.TierCreate, db: Session = Depends(database.get_db)):
    """Create a new tier"""
    db_tier = crud.create_tier(db, tier)
    return schemas.Tier.from_orm(db_tier)

@app.put("/tiers/{tier_id}")
def update_tier(tier_id: int, tier: schemas.TierCreate, db: Session = Depends(database.get_db)):
    """Update an existing tier"""
    db_tier = crud.update_tier(db, tier_id, tier)
    if not db_tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    return schemas.Tier.from_orm(db_tier)

@app.delete("/tiers/{tier_id}")
def delete_tier(tier_id: int, db: Session = Depends(database.get_db)):
    """Delete a tier"""
    db_tier = crud.delete_tier(db, tier_id)
    if not db_tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    return {"message": "Tier deleted successfully"}

# Reward management endpoints
@app.get("/rewards/")
def get_rewards(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all active rewards"""
    rewards = crud.get_rewards(db, skip=skip, limit=limit)
    return [schemas.Reward.from_orm(reward) for reward in rewards]

@app.get("/rewards/tier/{tier_id}")
def get_rewards_by_tier(tier_id: int, db: Session = Depends(database.get_db)):
    """Get all rewards for a specific tier"""
    rewards = crud.get_rewards_by_tier(db, tier_id)
    return [schemas.Reward.from_orm(reward) for reward in rewards]

@app.post("/rewards/")
def create_reward(reward: schemas.RewardCreate, db: Session = Depends(database.get_db)):
    """Create a new reward"""
    db_reward = crud.create_reward(db, reward)
    return schemas.Reward.from_orm(db_reward)

@app.put("/rewards/{reward_id}")
def update_reward(reward_id: int, reward: schemas.RewardCreate, db: Session = Depends(database.get_db)):
    """Update an existing reward"""
    db_reward = crud.update_reward(db, reward_id, reward)
    if not db_reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    return schemas.Reward.from_orm(db_reward)

@app.delete("/rewards/{reward_id}")
def delete_reward(reward_id: int, db: Session = Depends(database.get_db)):
    """Delete a reward"""
    db_reward = crud.delete_reward(db, reward_id)
    if not db_reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    return {"message": "Reward deleted successfully"}

# Spinner option management endpoints
@app.get("/spinner-options/reward/{reward_id}")
def get_spinner_options_by_reward(reward_id: int, db: Session = Depends(database.get_db)):
    """Get all spinner options for a specific reward"""
    options = crud.get_spinner_options_by_reward(db, reward_id)
    return [schemas.SpinnerOption.from_orm(option) for option in options]

@app.post("/spinner-options/reward/{reward_id}")
def create_spinner_option(
    reward_id: int, 
    option: schemas.SpinnerOptionCreate, 
    db: Session = Depends(database.get_db)
):
    """Create a new spinner option for a reward"""
    db_option = crud.create_spinner_option(db, option, reward_id)
    return schemas.SpinnerOption.from_orm(db_option)

@app.put("/spinner-options/{option_id}")
def update_spinner_option(
    option_id: int, 
    option: schemas.SpinnerOptionCreate, 
    db: Session = Depends(database.get_db)
):
    """Update an existing spinner option"""
    db_option = crud.update_spinner_option(db, option_id, option)
    if not db_option:
        raise HTTPException(status_code=404, detail="Spinner option not found")
    return schemas.SpinnerOption.from_orm(db_option)

@app.delete("/spinner-options/{option_id}")
def delete_spinner_option(option_id: int, db: Session = Depends(database.get_db)):
    """Delete a spinner option"""
    db_option = crud.delete_spinner_option(db, option_id)
    if not db_option:
        raise HTTPException(status_code=404, detail="Spinner option not found")
    return {"message": "Spinner option deleted successfully"}

# User reward endpoints
@app.get("/user-rewards/{user_id}")
def get_user_rewards(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all rewards for a specific user"""
    user_rewards = crud.get_user_rewards(db, user_id, skip=skip, limit=limit)
    return [schemas.UserReward.from_orm(user_reward) for user_reward in user_rewards]

@app.put("/user-rewards/{user_reward_id}/use")
def use_user_reward(user_reward_id: int, db: Session = Depends(database.get_db)):
    """Mark a user reward as used"""
    db_user_reward = crud.update_user_reward_usage(db, user_reward_id)
    if not db_user_reward:
        raise HTTPException(status_code=404, detail="User reward not found")
    return schemas.UserReward.from_orm(db_user_reward)
