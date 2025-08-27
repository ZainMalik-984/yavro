# Face Recognition Cafe App - Setup Guide

## Quick Setup

The `setup.py` script combines all setup functionality into one comprehensive script. It handles:

1. **PostgreSQL Setup** - Creates database user and database
2. **Database Initialization** - Creates all required tables
3. **Schema Updates** - Adds phone_number column to users table
4. **Tier System Setup** - Initializes reward tiers and spinner options

## Prerequisites

- PostgreSQL installed and running
- Python 3.7+ with required dependencies (see requirements.txt)
- Environment variables configured (optional, defaults provided)

## Usage

### Run Complete Setup
```bash
python setup.py
```

This will run all setup steps automatically and provide status updates.

### Environment Variables (Optional)

You can set these environment variables to customize the setup:

```bash
export DB_USER=your_username
export DB_PASSWORD=your_password
export DB_HOST=your_host
export DB_PORT=5432
export DB_NAME=cafe_users
```

If not set, the script uses these defaults:
- DB_USER: postgres
- DB_PASSWORD: cafe_password123
- DB_HOST: localhost
- DB_PORT: 5432
- DB_NAME: cafe_users

## What the Setup Does

### 1. PostgreSQL Setup
- Connects to PostgreSQL server
- Creates database user if needed
- Creates `cafe_users` database
- Sets up proper permissions

### 2. Database Tables
Creates all required tables:
- users
- tiers
- rewards
- spinner_options
- user_visits
- user_rewards

### 3. Tier System
Initializes a 3-tier reward system:
- **Bronze** (5 visits): Free Coffee
- **Silver** (10 visits): 10% Discount
- **Gold** (15 visits): Reward Spinner

### 4. Spinner Options
For the Gold tier spinner, creates options:
- Free Coffee (40% probability)
- 15% Discount (30% probability)
- Free Pastry (20% probability)
- 20% Discount (10% probability)

## After Setup

Once setup is complete:

1. Start the backend server:
   ```bash
   cd app && python main.py
   ```

2. Start the frontend:
   ```bash
   cd frontend && npm start
   ```

3. Open your browser to `http://localhost:3000`

## Troubleshooting

### PostgreSQL Connection Issues
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check if postgres user exists: `sudo -u postgres psql -c "\du"`
- Verify port 5432 is open: `netstat -an | grep 5432`

### Permission Issues
- The script tries multiple methods to set up PostgreSQL
- If one method fails, it automatically tries alternative approaches
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### Database Already Exists
- The script safely handles existing databases
- It will skip creation if database/tables already exist
- No data will be lost during re-runs

## Manual Setup (Alternative)

If the automated setup fails, you can run individual functions from the `setup.py` file by modifying the script or importing specific functions.
