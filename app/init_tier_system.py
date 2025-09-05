#!/usr/bin/env python3
"""
Initialize the tier-based reward system with default tiers and rewards
"""

try:
    # Try importing as if running from root directory
    import app.schemas as schemas
    import app.crud as crud
    import app.database as database
except ImportError:
    # Try importing as if running from within app directory
    from app import schemas
    from app import crud
    from app import database


def init_tier_system():
    """Initialize the tier system with default tiers and rewards"""
    db = next(database.get_db())

    try:
        # Check if tiers already exist
        existing_tiers = crud.get_tiers(db)
        if existing_tiers:
            print("Tier system already initialized. Skipping...")
            return

        print("Initializing tier-based reward system...")

        # Create default tiers
        tiers_data = [
            {
                "name": "Bronze",
                "visit_requirement": 5,
                "description": "First tier - 5 visits"
            },
            {
                "name": "Silver",
                "visit_requirement": 10,
                "description": "Second tier - 10 visits"
            },
            {
                "name": "Gold",
                "visit_requirement": 15,
                "description": "Third tier - 15 visits"
            }
        ]

        created_tiers = []
        for tier_data in tiers_data:
            tier = schemas.TierCreate(**tier_data)
            db_tier = crud.create_tier(db, tier)
            created_tiers.append(db_tier)
            print(
                f"Created tier: {db_tier.name} (requires {db_tier.visit_requirement} visits)")

        # Create default rewards for each tier
        rewards_data = [
            {
                "tier_name": "Bronze",
                "name": "Free Coffee",
                "reward_type": "free_coffee",
                "description": "Get a free coffee on your 5th visit"
            },
            {
                "tier_name": "Silver",
                "name": "10% Discount",
                "reward_type": "discount",
                "value": 10.0,
                "description": "Get 10% discount on your 10th visit"
            },
            {
                "tier_name": "Gold",
                "name": "Reward Spinner",
                "reward_type": "spinner",
                "description": "Spin the wheel to get a random reward on your 15th visit"
            }
        ]

        created_rewards = []
        for reward_data in rewards_data:
            tier_name = reward_data.pop("tier_name")
            tier = next(t for t in created_tiers if t.name == tier_name)

            reward = schemas.RewardCreate(tier_id=tier.id, **reward_data)
            db_reward = crud.create_reward(db, reward)
            created_rewards.append(db_reward)
            print(f"Created reward: {db_reward.name} for {tier_name} tier")

        # Create spinner options for the Gold tier spinner
        gold_reward = next(r for r in created_rewards
                           if r.reward_type == "spinner")
        spinner_options_data = [
            {
                "name": "Free Coffee",
                "reward_type": "free_coffee",
                "description": "Win a free coffee",
                "probability": 0.4
            },
            {
                "name": "15% Discount",
                "reward_type": "discount",
                "value": 15.0,
                "description": "Win a 15% discount",
                "probability": 0.3
            },
            {
                "name": "Free Pastry",
                "reward_type": "free_coffee",  # Using same type for simplicity
                "description": "Win a free pastry",
                "probability": 0.2
            },
            {
                "name": "20% Discount",
                "reward_type": "discount",
                "value": 20.0,
                "description": "Win a 20% discount",
                "probability": 0.1
            }
        ]

        for option_data in spinner_options_data:
            option = schemas.SpinnerOptionCreate(**option_data)
            db_option = crud.create_spinner_option(db, option,
                                                   gold_reward.id)
            print(f"Created spinner option: {db_option.name} "
                  f"(probability: {db_option.probability})")

        print("Tier-based reward system initialized successfully!")

    except Exception as e:
        print(f"Error initializing tier system: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_tier_system()
