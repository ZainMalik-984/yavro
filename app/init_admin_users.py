from app.database import engine, get_db
from app.models import Base, AdminUser
from app.auth import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_admin_users():
    """Initialize admin users table and create default admin user"""
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")

        # Get database session
        db = next(get_db())

        # Check if admin users table exists and has any users
        admin_users = db.query(AdminUser).all()

        if not admin_users:
            # Create default admin user
            default_admin = AdminUser(
                username="admin",
                email="admin@yavrocafe.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )

            # Create default POS user
            default_pos = AdminUser(
                username="pos",
                email="pos@yavrocafe.com",
                hashed_password=get_password_hash("pos123"),
                role="pos",
                is_active=True
            )

            db.add(default_admin)
            db.add(default_pos)
            db.commit()

            logger.info("Default admin users created successfully")
            logger.info("Admin credentials: username=admin, password=admin123")
            logger.info("POS credentials: username=pos, password=pos123")
        else:
            logger.info("Admin users already exist in database")

    except Exception as e:
        logger.error(f"Error initializing admin users: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_admin_users()
