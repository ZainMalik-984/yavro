# Tier-Based Reward System

This document describes the new tier-based reward system implemented in the face recognition coffee shop application.

## Overview

The tier-based reward system provides a structured approach to customer rewards based on visit frequency. Users progress through tiers as they accumulate visits, with each tier offering different types of rewards.

## Tier Structure

### Default Tiers
1. **Bronze Tier** (5 visits)
   - Reward: Free Coffee
   
2. **Silver Tier** (10 visits)
   - Reward: 10% Discount
   
3. **Gold Tier** (15 visits)
   - Reward: Spinner Wheel (random rewards)

### Spinner Wheel Options
The Gold tier spinner includes:
- Free Coffee (40% probability)
- 15% Discount (30% probability)
- Free Pastry (20% probability)
- 20% Discount (10% probability)

## Database Schema

### New Tables

#### `tiers`
- `id`: Primary key
- `name`: Tier name (e.g., "Bronze", "Silver", "Gold")
- `visit_requirement`: Number of visits required for this tier
- `description`: Tier description
- `is_active`: Whether the tier is active
- `created_at`: Creation timestamp

#### `rewards`
- `id`: Primary key
- `tier_id`: Foreign key to tiers table
- `name`: Reward name
- `reward_type`: Type of reward ("free_coffee", "discount", "spinner")
- `value`: Numeric value (for discounts)
- `description`: Reward description
- `is_active`: Whether the reward is active
- `created_at`: Creation timestamp

#### `spinner_options`
- `id`: Primary key
- `reward_id`: Foreign key to rewards table
- `name`: Option name
- `reward_type`: Type of reward
- `value`: Numeric value (for discounts)
- `probability`: Weight for random selection
- `description`: Option description
- `is_active`: Whether the option is active
- `created_at`: Creation timestamp

#### `user_rewards`
- `id`: Primary key
- `user_id`: Foreign key to users table
- `reward_id`: Foreign key to rewards table
- `spinner_option_id`: Foreign key to spinner_options (for spinner rewards)
- `visit_id`: Foreign key to visits table
- `reward_type`: Type of reward earned
- `value`: Actual value received
- `is_used`: Whether the reward has been used
- `used_at`: When the reward was used
- `created_at`: Creation timestamp

## API Endpoints

### Tier Management
- `GET /tiers/` - Get all active tiers
- `POST /tiers/` - Create a new tier
- `PUT /tiers/{tier_id}` - Update a tier
- `DELETE /tiers/{tier_id}` - Delete a tier

### Reward Management
- `GET /rewards/` - Get all active rewards
- `GET /rewards/tier/{tier_id}` - Get rewards for a specific tier
- `POST /rewards/` - Create a new reward
- `PUT /rewards/{reward_id}` - Update a reward
- `DELETE /rewards/{reward_id}` - Delete a reward

### Spinner Option Management
- `GET /spinner-options/reward/{reward_id}` - Get spinner options for a reward
- `POST /spinner-options/reward/{reward_id}` - Create a spinner option
- `PUT /spinner-options/{option_id}` - Update a spinner option
- `DELETE /spinner-options/{option_id}` - Delete a spinner option

### User Rewards
- `GET /user-rewards/{user_id}` - Get rewards for a specific user
- `PUT /user-rewards/{user_reward_id}/use` - Mark a reward as used

### Spinner Functionality
- `POST /spin-reward/` - Spin the reward wheel

## Frontend Dashboard

The application includes a comprehensive admin dashboard with four main sections:

### 1. Tier Management
- View all tiers
- Create new tiers
- Edit existing tiers
- Delete tiers
- Set visit requirements and descriptions

### 2. Reward Management
- View all rewards
- Create new rewards
- Edit existing rewards
- Delete rewards
- Assign rewards to tiers
- Configure reward types and values

### 3. Spinner Management
- View spinner options for each spinner reward
- Create new spinner options
- Edit existing options
- Delete options
- Set probability weights for random selection

### 4. User Rewards
- View reward history for all users
- Mark rewards as used
- Track reward status and usage dates

## Setup Instructions

### 1. Database Migration
Run the database initialization script to create the new tables:

```bash
python init_db.py
```

### 2. Initialize Tier System
Run the tier system initialization script to create default tiers and rewards:

```bash
python init_tier_system.py
```

### 3. Start the Application
Start the FastAPI backend:

```bash
cd app
uvicorn main:app --reload
```

### 4. Start the Frontend
Start the React frontend:

```bash
cd frontend
npm start
```

## Usage

### For Customers
1. Register with face recognition
2. Visit the coffee shop
3. Check out to record visits
4. Automatically progress through tiers
5. Earn rewards at each tier milestone
6. For Gold tier, spin the wheel for random rewards

### For Administrators
1. Access the admin dashboard via the "Admin Dashboard" button
2. Manage tiers, rewards, and spinner options
3. View user reward history
4. Mark rewards as used when customers redeem them

## Customization

### Adding New Tiers
1. Go to Tier Management in the dashboard
2. Click "Add New Tier"
3. Set the tier name, visit requirement, and description
4. Save the tier

### Adding New Rewards
1. Go to Reward Management in the dashboard
2. Click "Add New Reward"
3. Select the tier, set reward type and details
4. Save the reward

### Configuring Spinner Options
1. Go to Spinner Management in the dashboard
2. Select a spinner reward
3. Add spinner options with probability weights
4. Configure reward types and values for each option

## Technical Details

### Reward Logic
- Users automatically progress to higher tiers based on visit count
- Rewards are given when users reach tier milestones
- Spinner rewards use weighted random selection
- All rewards are tracked in the user_rewards table

### Frontend Features
- Responsive design for mobile and desktop
- Real-time updates when managing tiers and rewards
- Intuitive forms for creating and editing
- Confirmation dialogs for destructive actions
- Loading states and error handling

### Backend Features
- RESTful API design
- Comprehensive error handling
- Database transaction management
- Input validation using Pydantic schemas
- Logging for debugging and monitoring
