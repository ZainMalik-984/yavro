#!/usr/bin/env python3
"""
Database migration script to add phone_number column to users table
"""

from app.database import engine
import sys
import os
from sqlalchemy import text

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from config file if it exists
config_file = "../config.env"
if os.path.exists(config_file):
    with open(config_file, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value


def add_phone_number_column():
    """Add phone_number column to users table if it doesn't exist"""
    try:
        # Check if phone_number column already exists (PostgreSQL compatible)
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'phone_number'
            """))

            if result.fetchone():
                print("phone_number column already exists in users table")
                return

            # Add phone_number column
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN phone_number VARCHAR
            """))
            connection.commit()
            print("Successfully added phone_number column to users table")

    except Exception as e:
        print(f"Error adding phone_number column: {str(e)}")
        raise


if __name__ == "__main__":
    print("Adding phone_number column to users table...")
    add_phone_number_column()
    print("Database migration completed!")
