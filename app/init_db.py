
from database import engine, Base
import models
import logging

def init_db():
    """Initialize the database by creating all tables"""
    try:
        logging.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logging.info("Database tables created successfully!")
    except Exception as e:
        logging.error(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    init_db()
