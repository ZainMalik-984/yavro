#!/usr/bin/env python3
"""
PostgreSQL Database Setup Script
This script helps set up the PostgreSQL database for the face recognition project
"""

import psycopg2
import os
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def create_database():
    """Create the database if it doesn't exist"""

    # Database configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
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
        from app.init_db import init_db
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


if __name__ == "__main__":
    print("PostgreSQL Database Setup")
    print("=" * 40)

    # Test connection first
    if test_connection():
        print("Database connection successful!")
    else:
        print("Creating database...")
        create_database()
