#!/usr/bin/env python3
"""
Initialize the tier-based reward system with default tiers and rewards
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.init_tier_system import init_tier_system

if __name__ == "__main__":
    print("Initializing tier-based reward system...")
    init_tier_system()
    print("Tier system initialization complete!")
