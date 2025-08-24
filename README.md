# ☕ Face Recognition Coffee Shop with Tier-Based Rewards

A modern coffee shop application using face recognition technology with a sophisticated tier-based reward system.

## 🚀 Features

- **Face Recognition**: Register and identify customers
- **Visit Tracking**: Automatic visit counting
- **Tier-Based Rewards**: Progressive reward system
- **Spinner Rewards**: Interactive wheel for higher tiers
- **Admin Dashboard**: Complete management interface

## 🛠️ Technology Stack

**Backend**: FastAPI, SQLAlchemy, SQLite/PostgreSQL, Face Recognition
**Frontend**: React, TypeScript, Axios

## 📋 Prerequisites

- Python 3.10+
- Node.js 16+
- System dependencies for face recognition

### Ubuntu/Debian Dependencies:
```bash
sudo apt-get install python3-dev cmake libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev libboost-python-dev
```

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd face_recognition
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
pip install git+https://github.com/ageitgey/face_recognition_models
```

### 2. Initialize Database
```bash
python init_db.py
python init_tier_system.py
```

### 3. Start Backend
```bash
cd app
uvicorn main:app --reload
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm start
```

## 🎯 Usage

### Customer Registration
1. Click "Register New Customer"
2. Take photo and fill details
3. Submit to register

### Customer Checkout
1. Click "Checkout Customer"
2. Take photo for identification
3. System processes visit and awards rewards

### Admin Dashboard
Access via "Admin Dashboard" button to manage:
- **Tiers**: Configure visit requirements
- **Rewards**: Set reward types and values
- **Spinner**: Manage wheel options and probabilities
- **User Rewards**: Track and manage customer rewards

## 🎨 Reward System

- **Bronze** (5 visits): Free Coffee
- **Silver** (10 visits): 10% Discount
- **Gold** (15 visits): Spinner Wheel with multiple options

## 📁 Project Structure

```
face_recognition/
├── app/                    # Backend (FastAPI)
├── frontend/              # React frontend
├── config.env             # Configuration
└── requirements.txt       # Dependencies
```

## 🔧 Configuration

### Database (config.env)
```env
DB_TYPE=sqlite              # or postgresql
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cafe_users
```

## 🐛 Troubleshooting

### Face Recognition Issues
```bash
pip install face-recognition==1.3.0
```

### Import Errors
- Run commands from correct directory
- Ensure virtual environment is activated

### Frontend Issues
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📈 Production

- Use PostgreSQL for production database
- Set up HTTPS and proper authentication
- Configure environment variables
- Use production WSGI server (Gunicorn)

## 📄 License

MIT License

---

**Happy Brewing! ☕✨**
