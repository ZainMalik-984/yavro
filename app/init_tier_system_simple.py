#!/usr/bin/env python3
"""
Initialize the tier-based reward system with default tiers and rewards
"""

from sqlalchemy.orm import Session
from app import models, schemas, database

def init_tier_system():
    """Initialize the tier system with default tiers and rewards"""
    db = next(database.get_db())
    
    try:
        # Check if tiers already exist
        existing_tiers = db.query(models.Tier).filter(models.Tier.is_active == True).all()
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
            tier = models.Tier(**tier_data)
            db.add(tier)
            created_tiers.append(tier)
            print(f"Created tier: {tier.name} (requires {tier.visit_requirement} visits)")
        
        db.commit()
        
        # Create default rewards for each tier
        rewards_data = [
            {
                "tier_id": 1,  # Bronze
                "name": "Free Coffee",
                "reward_type": "free_coffee",
                "description": "Get a free coffee on your 5th visit"
            },
            {
                "tier_id": 2,  # Silver
                "name": "10% Discount",
                "reward_type": "discount",
                "value": 10.0,
                "description": "Get 10% discount on your 10th visit"
            },
            {
                "tier_id": 3,  # Gold
                "name": "Reward Spinner",
                "reward_type": "spinner",
                "description": "Spin the wheel to get a random reward on your 15th visit"
            }
        ]
        
        created_rewards = []
        for reward_data in rewards_data:
            reward = models.Reward(**reward_data)
            db.add(reward)
            created_rewards.append(reward)
            print(f"Created reward: {reward.name}")
        
        db.commit()
        
        # Create spinner options for the Gold tier spinner
        gold_reward = next(r for r in created_rewards if r.reward_type == "spinner")
        spinner_options_data = [
            {
                "reward_id": gold_reward.id,
                "name": "Free Coffee",
                "reward_type": "free_coffee",
                "description": "Win a free coffee",
                "probability": 0.4
            },
            {
                "reward_id": gold_reward.id,
                "name": "15% Discount",
                "reward_type": "discount",
                "value": 15.0,
                "description": "Win a 15% discount",
                "probability": 0.3
            },
            {
                "reward_id": gold_reward.id,
                "name": "Free Pastry",
                "reward_type": "free_coffee",  # Using same type for simplicity
                "description": "Win a free pastry",
                "probability": 0.2
            },
            {
                "reward_id": gold_reward.id,
                "name": "20% Discount",
                "reward_type": "discount",
                "value": 20.0,
                "description": "Win a 20% discount",
                "probability": 0.1
            }
        ]
        
        for option_data in spinner_options_data:
            option = models.SpinnerOption(**option_data)
            db.add(option)
            print(f"Created spinner option: {option.name} (probability: {option.probability})")
        
        db.commit()
        print("Tier-based reward system initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing tier system: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_tier_system()
