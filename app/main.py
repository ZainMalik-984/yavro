
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app import models
from app import schemas
from app import crud
from app import database
from app import auth
from datetime import timedelta
import face_recognition
import numpy as np
import logging
from mangum import Mangum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI()
handler = Mangum(app)
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],  # Allow React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




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
            raise HTTPException(
                status_code=400, detail="No face detected in the image.")

        # Get face encodings
        encodings = face_recognition.face_encodings(image, face_locations)

        if not encodings:
            raise HTTPException(
                status_code=400, detail="Could not encode face features.")

        # If multiple faces detected, use the first one
        if len(encodings) > 1:
            logging.warning(f"Multiple faces detected, using the first one")

        encoding = encodings[0]
        logging.info(f"Face encoding shape: {encoding.shape}")

        return encoding

    except Exception as e:
        logging.error(f"Error in face encoding: {str(e)}")
        if "No face detected" in str(e):
            raise HTTPException(
                status_code=400, detail="No face detected in the image.")
        raise HTTPException(
            status_code=500, detail=f"Error processing face: {str(e)}")


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
    phone_number: str = Form(...),
    db: Session = Depends(database.get_db)
):
    import logging
    try:
        encoding = get_face_encoding(file)
        db_user = crud.get_user_by_phone(db, phone_number=phone_number)
        if db_user:
            raise HTTPException(
                status_code=400, detail="Phone number already registered")
        user_data = schemas.UserCreate(
            name=name, phone_number=phone_number)
        user = crud.create_user(db=db, user=user_data, face_encoding=encoding)
        return schemas.User.from_orm(user)
    except Exception as e:
        logging.exception("Error in /register endpoint")
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/checkout/{user_id}/")
def checkout_user(user_id: int, db: Session = Depends(database.get_db)):
    """Create a visit for a user and handle tier-based reward system"""
    try:
        # Import SMS service
        from app.sms_service import sms_service

        # Check if user exists
        user = crud.get_user(db, user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create visit and update visit count
        visit, updated_user = crud.create_visit(db, user_id)

        # Check for tier upgrade
        updated_user = crud.check_tier_upgrade(db, user_id)

        # Check if this visit qualifies for a reward based on multiples of tier requirements
        reward_earned = None
        message = f"Visit recorded successfully for {user.name}"

        if updated_user:
            # Check if user should get rewards based on multiples of tier visit requirements
            matching_rewards = crud.check_all_multiple_based_rewards(
                db, user_id, updated_user.visit_count)

            # For now, we'll use the highest priority reward (first in the list)
            # In the future, you could modify this to handle multiple rewards
            if matching_rewards:
                # Get the highest priority reward
                reward, tier = matching_rewards[0]

                # Send SMS notification for reward earned
                if user.phone_number:
                    sms_service.send_reward_notification(
                        user.phone_number, user.name, reward.reward_type,
                        tier.name, updated_user.visit_count
                    )

                if reward.reward_type == "spinner":
                    message += (f"! 🎉 Congratulations! You've reached "
                                f"{updated_user.visit_count} visits! Spin the wheel "
                                f"to get your {tier.name} tier reward!")
                    reward_earned = {
                        "type": "spinner",
                        "reward_id": reward.id,
                        "tier_name": tier.name,
                        "message": (f"Spin the wheel to get your "
                                    f"{tier.name} tier reward!")
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
                    user_reward = crud.create_user_reward(
                        db, user_reward_data)

                    if reward.reward_type == "free_coffee":
                        message += (f"! 🎉 Congratulations! You've earned a "
                                    f"FREE COFFEE at {tier.name} tier "
                                    f"(visit #{updated_user.visit_count})!")
                        reward_earned = {
                            "type": "free_coffee",
                            "reward_id": reward.id,
                            "user_reward_id": user_reward.id,
                            "tier_name": tier.name,
                            "message": f"Free coffee earned at {tier.name} tier!"
                        }
                    elif reward.reward_type == "discount":
                        message += (f"! 🎉 Congratulations! You've earned a "
                                    f"{reward.value}% DISCOUNT at {tier.name} tier "
                                    f"(visit #{updated_user.visit_count})!")
                        reward_earned = {
                            "type": "discount",
                            "reward_id": reward.id,
                            "user_reward_id": user_reward.id,
                            "tier_name": tier.name,
                            "discount_percentage": reward.value,
                            "message": (f"{reward.value}% discount earned at "
                                        f"{tier.name} tier!")
                        }
            else:
                # Check next tier progress
                next_tier = db.query(models.Tier).filter(
                    models.Tier.visit_requirement > updated_user.visit_count,
                    models.Tier.is_active
                ).order_by(models.Tier.visit_requirement).first()

                if next_tier:
                    visits_remaining = next_tier.visit_requirement - updated_user.visit_count
                    message += f". You need {visits_remaining} more visit{'s' if visits_remaining != 1 else ''} to reach {next_tier.name} tier."

                    # Send SMS notification for tier progress
                    if user.phone_number:
                        sms_service.send_tier_progress_notification(
                            user.phone_number, user.name, updated_user.visit_count,
                            next_tier.name, visits_remaining
                        )
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
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error: {str(e)}")


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
            raise HTTPException(
                status_code=400, detail="Invalid reward or not a spinner reward")

        # Spin the wheel
        selected_option = crud.spin_reward(db, request.reward_id)
        if not selected_option:
            raise HTTPException(
                status_code=400, detail="No spinner options available")

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
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.get("/user/{user_id}")
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Return only serializable fields using Pydantic schema
    return schemas.User.from_orm(user)


@app.get("/user/phone/{phone}")
def get_user_by_phone(phone: str, db: Session = Depends(database.get_db)):
    """Get user by phone number"""
    user = crud.get_user_by_phone(db, phone_number=phone)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.User.from_orm(user)


@app.post("/register/no-image/")
def register_user_without_image(
    user_data: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    """Register a new user without face image"""
    try:
        # Check if phone number already exists
        db_user = crud.get_user_by_phone(db, phone_number=user_data.phone_number)
        if db_user:
            raise HTTPException(
                status_code=400, detail="Phone number already registered")
        
        # Create user without face encoding
        user = crud.create_user_without_face(db=db, user=user_data)
        return schemas.User.from_orm(user)
    except Exception as e:
        logging.exception("Error in /register/no-image endpoint")
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.get("/users/")
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all users with pagination"""
    users = crud.get_all_users(db, skip=skip, limit=limit)
    return [schemas.User.from_orm(user) for user in users]


@app.put("/user/{user_id}")
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db)):
    """Update user information"""
    user = crud.update_user(db, user_id, user_update.dict(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.User.from_orm(user)


@app.delete("/user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    """Delete a user and all associated data"""
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


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


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Face Recognition API is running"}


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


# App Settings endpoints
@app.get("/app-settings/")
def get_app_settings(db: Session = Depends(database.get_db)):
    """Get current app settings"""
    settings = crud.get_app_settings(db)
    if not settings:
        # Return default settings if none exist
        return {
            "cafe_name": "Yavro Cafe",
            "cafe_tagline": "Brewing Connections, One Cup at a Time",
            "cafe_logo_base64": None
        }
    return schemas.AppSettings.from_orm(settings)


@app.post("/app-settings/")
def create_app_settings(
    app_settings: schemas.AppSettingsCreate,
    db: Session = Depends(database.get_db)
):
    """Create new app settings"""
    db_settings = crud.create_app_settings(db, app_settings)
    return schemas.AppSettings.from_orm(db_settings)


@app.put("/app-settings/")
def update_app_settings(
    app_settings: schemas.AppSettingsUpdate,
    db: Session = Depends(database.get_db)
):
    """Update current app settings"""
    db_settings = crud.update_app_settings(db, app_settings)
    return schemas.AppSettings.from_orm(db_settings)


@app.post("/app-settings/upload-logo")
async def upload_cafe_logo(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    """Upload cafe logo as base64"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content and convert to base64
    import base64
    content = await file.read()
    logo_base64 = base64.b64encode(content).decode('utf-8')
    
    # Add data URL prefix for frontend display
    mime_type = file.content_type
    data_url = f"data:{mime_type};base64,{logo_base64}"
    
    # Update database with logo base64
    db_settings = crud.update_cafe_logo(db, data_url)
    return schemas.AppSettings.from_orm(db_settings)


@app.delete("/app-settings/{settings_id}")
def delete_app_settings(settings_id: int, db: Session = Depends(database.get_db)):
    """Delete app settings by ID"""
    success = crud.delete_app_settings(db, settings_id)
    if not success:
        raise HTTPException(status_code=404, detail="App settings not found")
    return {"message": "App settings deleted successfully"}


# Authentication endpoints
@app.post("/auth/login")
def login(
    user_credentials: schemas.AdminUserLogin,
    db: Session = Depends(database.get_db)
):
    """Login endpoint for admin users"""
    user = auth.authenticate_user(
        db, user_credentials.username, user_credentials.password
    )
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.AdminUser.from_orm(user)
    )


@app.post("/auth/register")
def register_admin_user(
    admin_user: schemas.AdminUserCreate,
    db: Session = Depends(database.get_db)
):
    """Register a new admin user"""
    db_user = crud.create_admin_user(db, admin_user)
    if not db_user:
        raise HTTPException(
            status_code=400, detail="Username or email already registered"
        )
    return schemas.AdminUser.from_orm(db_user)


@app.post("/auth/register/super-admin")
def register_super_admin(
    super_admin: schemas.SuperAdminCreate,
    db: Session = Depends(database.get_db)
):
    """Register a new super admin user - only allowed with specific email"""
    import os
    
    # Check if the email matches the configured super admin email
    super_admin_email = os.getenv("SUPER_ADMIN_EMAIL")
    if not super_admin_email or super_admin.email != super_admin_email:
        raise HTTPException(
            status_code=403, 
            detail="Super admin registration not allowed for this email"
        )
    
    # Create admin user with super-admin role
    admin_user_data = schemas.AdminUserCreate(
        username=super_admin.username,
        email=super_admin.email,
        password=super_admin.password,
        role="super-admin"
    )
    
    db_user = crud.create_admin_user(db, admin_user_data)
    if not db_user:
        raise HTTPException(
            status_code=400, detail="Username or email already registered"
        )
    return schemas.AdminUser.from_orm(db_user)


@app.get("/auth/me")
def get_current_user_info(
    current_user: models.AdminUser = Depends(auth.get_current_active_user)
):
    """Get current user information"""
    return schemas.AdminUser.from_orm(current_user)


# Protected endpoints that require authentication
@app.get("/admin/users/")
def get_users_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_pos_or_admin_role)
):
    """Get all users with pagination (requires POS or admin role)"""
    users = crud.get_all_users(db, skip=skip, limit=limit)
    return [schemas.User.from_orm(user) for user in users]


@app.put("/admin/user/{user_id}")
def update_user_admin(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_pos_or_admin_role)
):
    """Update user information (requires POS or admin role)"""
    user = crud.update_user(db, user_id, user_update.dict(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.User.from_orm(user)


@app.delete("/admin/user/{user_id}")
def delete_user_admin(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_admin_role)
):
    """Delete a user (requires admin role)"""
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@app.get("/admin/admin-users/")
def get_admin_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_admin_role)
):
    """Get all admin users (requires admin role)"""
    admin_users = crud.get_all_admin_users(db, skip=skip, limit=limit)
    return [schemas.AdminUser.from_orm(user) for user in admin_users]


@app.post("/admin/admin-users/")
def create_admin_user_endpoint(
    admin_user: schemas.AdminUserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_admin_role)
):
    """Create a new admin user (requires admin role)"""
    db_user = crud.create_admin_user(db, admin_user)
    if not db_user:
        raise HTTPException(
            status_code=400, detail="Username or email already registered"
        )
    return schemas.AdminUser.from_orm(db_user)


@app.post("/super-admin/admin-users/")
def create_admin_user_super_admin(
    admin_user: schemas.AdminUserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_super_admin_role)
):
    """Create a new admin user (requires super-admin role)"""
    db_user = crud.create_admin_user(db, admin_user)
    if not db_user:
        raise HTTPException(
            status_code=400, detail="Username or email already registered"
        )
    return schemas.AdminUser.from_orm(db_user)


@app.put("/admin/admin-users/{user_id}")
def update_admin_user_endpoint(
    user_id: int,
    admin_user_update: schemas.AdminUserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_admin_role)
):
    """Update admin user (requires admin role)"""
    user = crud.update_admin_user(
        db, user_id, admin_user_update.dict(exclude_unset=True)
    )
    if not user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    return schemas.AdminUser.from_orm(user)


@app.delete("/admin/admin-users/{user_id}")
def delete_admin_user_endpoint(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.AdminUser = Depends(auth.require_admin_role)
):
    """Delete admin user (requires admin role)"""
    success = crud.delete_admin_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Admin user not found")
    return {"message": "Admin user deleted successfully"}
