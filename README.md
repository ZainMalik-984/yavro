# Face Recognition App

A complete face recognition application with React frontend, FastAPI backend, and PostgreSQL database.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- PostgreSQL 12 or higher
- pip and npm package managers

### Setup

#### 1. Backend Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd face_recognition

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Set up PostgreSQL database
# Create a database named 'cafe_users'
# Create a user 'cafe_db_user' with password 'cafe_password123'
# Or update config.env with your database credentials

# Initialize the database
python app/init_db.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

That's it! The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
face_recognition/
├── app/                    # FastAPI backend
├── frontend/              # React frontend
├── setup/                 # Database setup scripts
├── config.env             # Configuration file
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🛠️ Management Commands

```bash
# Start backend (from project root)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start frontend (from frontend directory)
npm start

# Build frontend for production
npm run build

# Run backend tests
python -m pytest

# Run frontend tests
npm test
```

## 🔧 Services

- **Frontend (React)**: Port 3000
- **Backend (FastAPI)**: Port 8000
- **Database (PostgreSQL)**: Port 5432

## 📚 API Endpoints

- `POST /recognize/` - Face recognition
- `POST /register/` - User registration
- `GET /users/` - List all users
- `GET /tiers/` - List all tiers
- `GET /rewards/` - List all rewards
- `GET /health` - Health check

## 🗄️ Database Setup

### PostgreSQL Setup

1. Install PostgreSQL on your system
2. Create a database:
```sql
CREATE DATABASE cafe_users;
```

3. Create a user:
```sql
CREATE USER cafe_db_user WITH PASSWORD 'cafe_password123';
GRANT ALL PRIVILEGES ON DATABASE cafe_users TO cafe_db_user;
```

4. Update `config.env` with your database credentials if different from defaults

5. Initialize the database:
```bash
python app/init_db.py
```

### Alternative: SQLite Setup

If you prefer SQLite (for development), update `config.env`:
```
DB_TYPE=sqlite
```

The database will be automatically created as `cafe_users.db` in the project root.

## 🔒 Configuration

Edit `config.env` to customize:
- Database credentials
- Twilio SMS settings
- Debug mode

Example `config.env`:
```env
DB_TYPE=postgresql
DB_USER=cafe_db_user
DB_PASSWORD=cafe_password123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cafe_users
DEBUG=True
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432
```

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `config.env`
- Ensure database and user exist
- Try connecting with `psql` to test credentials

### Python Dependencies
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Node.js Dependencies
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📦 What's Included

✅ **React Frontend** - Modern UI with Material-UI  
✅ **FastAPI Backend** - High-performance API  
✅ **PostgreSQL Database** - Reliable data storage  
✅ **Face Recognition** - Advanced face detection  
✅ **User Management** - Registration and recognition  
✅ **Tier System** - Customer loyalty program  
✅ **Rewards System** - Spinner wheel and rewards  
✅ **Auto Setup** - Easy local deployment  

## 🎯 Features

- **Face Recognition**: Register and recognize users by face
- **User Management**: Complete user lifecycle management
- **Tier System**: Bronze, Silver, Gold, Platinum tiers
- **Rewards**: Spinner wheel and reward management
- **SMS Integration**: Twilio integration for notifications
- **Real-time Updates**: Live data updates
- **Responsive Design**: Works on all devices
- **API Documentation**: Auto-generated Swagger docs

## 🔄 Development

The application is set up for development with:
- Hot reloading for both frontend and backend
- Development-friendly configuration
- Easy debugging and logging
- TypeScript support for frontend

## 📄 License

[Your License Here]
