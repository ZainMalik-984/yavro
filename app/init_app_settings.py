from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app import schemas
from app import crud


def init_app_settings():
    """Initialize app settings with default values"""
    db = SessionLocal()
    try:
        # Check if app settings already exist
        existing_settings = crud.get_app_settings(db)
        if existing_settings:
            print("App settings already exist, skipping initialization")
            return

        # Create default app settings
        default_settings = schemas.AppSettingsCreate(
            cafe_name="Yavro Cafe",
            cafe_tagline="Brewing Connections, One Cup at a Time"
        )

        db_settings = crud.create_app_settings(db, default_settings)
        print(f"Created default app settings: {db_settings.cafe_name}")

    except Exception as e:
        print(f"Error initializing app settings: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    init_app_settings()
