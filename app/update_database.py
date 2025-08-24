from sqlalchemy import text
from database import engine, SessionLocal
from models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_database():
    """Update database schema to include Visit table and visit_count column"""
    try:
        # Create all tables (this will create the Visit table)
        Base.metadata.create_all(bind=engine)
        logger.info("Created all tables")
        
        # Add visit_count column to existing users table if it doesn't exist
        with engine.connect() as connection:
            # Check if visit_count column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'visit_count'
            """))
            
            if not result.fetchone():
                # Add visit_count column
                connection.execute(text("ALTER TABLE users ADD COLUMN visit_count INTEGER DEFAULT 0"))
                connection.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
                logger.info("Added visit_count and created_at columns to users table")
            else:
                logger.info("visit_count column already exists")
            
            # Check if created_at column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'created_at'
            """))
            
            if not result.fetchone():
                # Add created_at column
                connection.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
                logger.info("Added created_at column to users table")
            else:
                logger.info("created_at column already exists")
            
            connection.commit()
        
        logger.info("Database update completed successfully!")
        
    except Exception as e:
        logger.error(f"Error updating database: {str(e)}")
        raise

if __name__ == "__main__":
    update_database()
