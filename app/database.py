from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Load environment variables from config file if it exists
config_file = "config.env"
if os.path.exists(config_file):
    with open(config_file, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

# Database configuration
# Use SQLite for simplicity, or PostgreSQL if configured
DB_TYPE = os.getenv("DB_TYPE", "sqlite")

if DB_TYPE == "postgresql":
    # PostgreSQL connection configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "cafe_users")
    
    # PostgreSQL connection URL
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    # SQLite connection URL (default)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./cafe_users.db"

# Create engine with database-specific settings
if DB_TYPE == "postgresql":
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using them
        pool_recycle=300,    # Recycle connections after 5 minutes
    )
else:
    # SQLite engine
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}  # Required for SQLite
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
