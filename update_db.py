#!/usr/bin/env python3
"""
Database update script for the face recognition app
"""
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.update_database import update_database

if __name__ == "__main__":
    print("Updating database schema...")
    update_database()
    print("Database update completed!")
