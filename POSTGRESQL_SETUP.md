# PostgreSQL Setup Guide

This guide will help you migrate from SQLite to PostgreSQL for the Face Recognition Cafe Management System.

## Prerequisites

1. **PostgreSQL installed** on your system
2. **Python 3.7+** with pip

## Installation Steps

### 1. Install PostgreSQL Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install PostgreSQL (if not already installed)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (using Homebrew):**
```bash
brew install postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 3. Start PostgreSQL Service

**Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew services start postgresql
```

### 4. Create PostgreSQL User and Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create a new user (replace 'your_username' and 'your_password')
CREATE USER your_username WITH PASSWORD 'your_password';

# Create database
CREATE DATABASE cafe_users OWNER your_username;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cafe_users TO your_username;

# Exit PostgreSQL
\q
```

### 5. Configure Database Connection

Create a `config.env` file in the project root:

```bash
cp config.env.example config.env
```

Edit `config.env` with your PostgreSQL credentials:

```env
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cafe_users
DEBUG=True
```

### 6. Initialize Database

```bash
python setup_postgres.py
```

This script will:
- Test the database connection
- Create the database if it doesn't exist
- Create all necessary tables

### 7. Run the Application

```bash
uvicorn app.main:app --reload
```

## Migration from SQLite

If you have existing data in SQLite that you want to migrate:

1. **Export SQLite data:**
```bash
sqlite3 cafe_users.db ".dump" > sqlite_dump.sql
```

2. **Convert and import to PostgreSQL:**
```bash
# You'll need to manually convert the SQLite dump to PostgreSQL format
# and import it using psql
psql -U your_username -d cafe_users -f converted_dump.sql
```

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

2. **Test connection:**
```bash
python setup_postgres.py
```

3. **Check firewall settings** (if connecting to remote database)

### Permission Issues

1. **Check PostgreSQL authentication:**
Edit `/etc/postgresql/*/main/pg_hba.conf` and ensure proper authentication method

2. **Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

### Data Type Issues

The application now uses PostgreSQL-specific data types:
- `BYTEA` for face encodings (instead of `LargeBinary`)
- Proper indexing for better performance

## Environment Variables

You can also set environment variables directly:

```bash
export DB_USER=your_username
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=cafe_users
```

## Benefits of PostgreSQL

1. **Better Performance**: Optimized for concurrent access
2. **ACID Compliance**: Full transaction support
3. **Advanced Features**: JSON support, full-text search, etc.
4. **Scalability**: Better for production environments
5. **Data Integrity**: Stronger constraints and validation

## Production Considerations

1. **Connection Pooling**: Already configured in the application
2. **Backup Strategy**: Set up regular PostgreSQL backups
3. **Monitoring**: Use PostgreSQL monitoring tools
4. **Security**: Use SSL connections and proper authentication 