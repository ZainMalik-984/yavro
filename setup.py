#!/usr/bin/env python3
"""
Comprehensive Setup Script for Face Recognition Cafe App
This script handles all setup tasks including PostgreSQL setup, 
database initialization, and tier system setup
"""

import psycopg2
import os
import subprocess
import sys
import logging
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def setup_postgres_user():
    """Set up PostgreSQL user and database"""

    print("Setting up PostgreSQL user and database...")

    # Try to connect as postgres user and create the database user
    try:
        # Connect to PostgreSQL as postgres user
        conn = psycopg2.connect(
            user="postgres",
            password="",  # No password for local postgres
            host="localhost",
            port="5432",
            database="postgres"
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Create user if it doesn't exist
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
                    CREATE USER postgres WITH PASSWORD 'password';
                END IF;
            END
            $$;
        """)

        # Grant privileges
        cursor.execute("ALTER USER postgres WITH SUPERUSER;")

        # Create database if it doesn't exist
        cursor.execute("""
            SELECT 'CREATE DATABASE cafe_users'
            WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cafe_users')
        """)

        result = cursor.fetchone()
        if result:
            cursor.execute(result[0])
            print("Database 'cafe_users' created successfully!")
        else:
            print("Database 'cafe_users' already exists.")

        cursor.close()
        conn.close()

        print("PostgreSQL setup completed successfully!")
        return True

    except psycopg2.Error as e:
        print(f"Error setting up PostgreSQL: {e}")
        print("\nTrying alternative setup method...")
        return setup_postgres_alternative()


def setup_postgres_alternative():
    """Alternative setup method using command line"""

    try:
        # Set password for postgres user
        subprocess.run([
            "sudo", "-u", "postgres", "psql",
            "-c", "ALTER USER postgres PASSWORD 'password';"
        ], check=True)

        # Create database
        subprocess.run([
            "sudo", "-u", "postgres", "createdb", "cafe_users"
        ], check=True)

        print("PostgreSQL setup completed using alternative method!")
        return True

    except subprocess.CalledProcessError as e:
        print(f"Error in alternative setup: {e}")
        return False


def create_database():
    """Create the database if it doesn't exist"""

    # Database configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "cafe_password123")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "cafe_users")

    try:
        # Connect to PostgreSQL server (not to a specific database)
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database="postgres"  # Connect to default postgres database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
        exists = cursor.fetchone()

        if not exists:
            print(f"Creating database '{DB_NAME}'...")
            cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
            print(f"Database '{DB_NAME}' created successfully!")
        else:
            print(f"Database '{DB_NAME}' already exists.")

        cursor.close()
        conn.close()

        # Now connect to the specific database and create tables
        print("Creating tables...")
        init_db()
        print("Tables created successfully!")

    except psycopg2.Error as e:
        print(f"Error: {e}")
        print("\nMake sure PostgreSQL is running and the connection details are correct.")
        print("You can set environment variables:")
        print("  export DB_USER=your_username")
        print("  export DB_PASSWORD=your_password")
        print("  export DB_HOST=your_host")
        print("  export DB_PORT=5432")
        print("  export DB_NAME=cafe_users")


def test_connection():
    """Test the database connection"""
    try:
        from app.database import engine
        with engine.connect() as conn:
            result = conn.execute("SELECT version();")
            version = result.fetchone()[0]
            print(f"Successfully connected to PostgreSQL!")
            print(f"PostgreSQL version: {version}")
            return True
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False


def init_db():
    """Initialize the database by creating all tables"""
    try:
        # Add app directory to path
        sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

        from app.database import engine, Base
        logging.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logging.info("Database tables created successfully!")
    except Exception as e:
        logging.error(f"Error creating database tables: {e}")
        raise


def init_tier_system():
    """Initialize the tier system with default tiers and rewards"""
    try:
        # Add app directory to path
        sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

        import app.schemas as schemas
        import app.crud as crud
        import app.database as database

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

    except Exception as e:
        print(f"Error initializing tier system: {str(e)}")
        raise


def update_database():
    """Update database schema (add phone_number column)"""
    try:
        # Add app directory to path
        sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

        from app.database import engine
        from sqlalchemy import text

        # Load environment variables from config file if it exists
        config_file = "config.env"
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value

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


def run_full_setup():
    """Run the complete setup process"""
    print("Face Recognition Cafe App - Complete Setup")
    print("=" * 50)

    # Step 1: PostgreSQL Setup
    print("\n1. Setting up PostgreSQL...")
    if setup_postgres_user():
        print("✅ PostgreSQL setup completed!")
    else:
        print("❌ PostgreSQL setup failed. Trying alternative method...")
        if not create_database():
            print("❌ Database creation failed. Please check PostgreSQL installation.")
            return False

    # Step 2: Test Connection
    print("\n2. Testing database connection...")
    if test_connection():
        print("✅ Database connection successful!")
    else:
        print("❌ Database connection failed.")
        return False

    # Step 3: Initialize Database Tables
    print("\n3. Initializing database tables...")
    try:
        init_db()
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        return False

    # Step 4: Update Database Schema
    print("\n4. Updating database schema...")
    try:
        update_database()
        print("✅ Database schema updated successfully!")
    except Exception as e:
        print(f"❌ Error updating database schema: {e}")
        return False

    # Step 5: Initialize Tier System
    print("\n5. Initializing tier-based reward system...")
    try:
        init_tier_system()
        print("✅ Tier system initialized successfully!")
    except Exception as e:
        print(f"❌ Error initializing tier system: {e}")
        return False

    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\nYour Face Recognition Cafe App is ready to use!")
    print("\nNext steps:")
    print("1. Start the backend server: cd app && python main.py")
    print("2. Start the frontend: cd frontend && npm start")
    print("3. Open your browser to http://localhost:3000")

    return True


if __name__ == "__main__":
    try:
        success = run_full_setup()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nSetup interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error during setup: {e}")
        sys.exit(1)
