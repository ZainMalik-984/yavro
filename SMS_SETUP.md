# SMS Setup with Twilio

This document explains how to set up SMS notifications using Twilio for the Face Recognition Cafe Rewards System.

## Features Added

1. **Phone Number Collection**: Users now provide their phone number during registration
2. **SMS Notifications**: Users receive SMS messages when:
   - They earn a reward (free coffee, discount, or spinner wheel)
   - They make progress toward the next tier

## Setup Instructions

### 1. Create a Twilio Account

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Get your Account SID and Auth Token from the dashboard
4. Purchase a phone number for sending SMS (or use the trial number)

### 2. Configure Environment Variables

Copy `config.env.example` to `config.env` and add your Twilio credentials:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
```

### 3. Install Dependencies

```bash
pip install twilio
```

### 4. Update Database Schema

Run the database migration to add the phone_number column:

```bash
cd app
python update_database.py
```

### 5. Restart the Application

```bash
# Backend
cd app
uvicorn main:app --reload

# Frontend (in another terminal)
cd frontend
npm start
```

## SMS Message Examples

### Reward Earned
```
🎉 Congratulations John! You've earned a FREE COFFEE at Silver tier (visit #10). Come claim your reward!
```

### Tier Progress
```
Hi John! You're making great progress! You have 8 visits. Just 2 more visits to reach Gold tier! 🚀
```

## Phone Number Format

The system automatically formats phone numbers:
- Removes non-digit characters (except +)
- Adds +1 country code for US numbers if not present
- Supports international numbers with + prefix

## Error Handling

- If Twilio credentials are not configured, SMS notifications are disabled but the app continues to work
- SMS sending errors are logged but don't affect the checkout process
- Users without phone numbers can still use the system normally

## Testing

1. Register a new user with a valid phone number
2. Perform checkouts to trigger SMS notifications
3. Check your phone for SMS messages
4. Verify the messages contain the correct reward/tier information

## Troubleshooting

### SMS Not Sending
- Verify Twilio credentials in config.env
- Check that the phone number is in the correct format
- Ensure you have sufficient Twilio credits
- Check application logs for error messages

### Phone Number Format Issues
- The system automatically formats US numbers
- For international numbers, include the country code with +
- Example: +44 20 7946 0958 for UK numbers

### Database Issues
- Run the migration script: `python app/update_database.py`
- Check that the phone_number column exists in the users table
- Verify database permissions and connection
