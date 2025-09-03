# Authentication System for Face Recognition App

This document describes the authentication system that has been added to the face recognition application.

## Overview

The application now includes a comprehensive authentication system with role-based access control:

- **Admin Role**: Full access to all features including user management, app administration, and system settings
- **POS Role**: Limited access for point-of-sale operations (customer registration, checkout, basic user management)

## Changes Made

### Backend Changes

1. **New Models** (`app/models.py`):
   - Added `AdminUser` model for authentication
   - Removed `email` and `address` fields from `User` model
   - Customer users now only require `name` and `phone_number`

2. **Authentication Module** (`app/auth.py`):
   - JWT token-based authentication
   - Password hashing with bcrypt
   - Role-based access control functions
   - Token verification and user validation

3. **Updated Schemas** (`app/schemas.py`):
   - Added authentication schemas (`AdminUser`, `AdminUserCreate`, `AdminUserLogin`, `Token`)
   - Updated `User` schemas to remove email and address fields

4. **Enhanced CRUD Operations** (`app/crud.py`):
   - Added admin user CRUD operations
   - Updated user operations to work with new schema

5. **New API Endpoints** (`app/main.py`):
   - `/auth/login` - User authentication
   - `/auth/register` - Admin user registration
   - `/auth/me` - Get current user info
   - Protected admin endpoints with role-based access

6. **Dependencies** (`requirements.txt`):
   - Added `python-jose[cryptography]` for JWT handling
   - Added `passlib[bcrypt]` for password hashing

### Frontend Changes

1. **New Components**:
   - `Login.tsx` - Authentication login form
   - `AppAdministration.tsx` - Admin user management interface

2. **Updated Components**:
   - `UserRegistration.tsx` - Removed email and address fields
   - `App.tsx` - Added authentication flow and role-based UI

3. **Enhanced API Service** (`services/api.ts`):
   - Added authentication interceptors
   - Automatic token handling
   - Role-based API functions

4. **Updated Types** (`types.ts`):
   - Added authentication-related interfaces
   - Updated user types to remove email and address

## Setup Instructions

### 1. Install New Dependencies

```bash
pip install -r requirements.txt
```

### 2. Initialize Database with Admin Users

Run the initialization script to create the admin users table and default users:

```bash
cd app
python init_admin_users.py
```

This will create:
- **Admin User**: username=`admin`, password=`admin123`, role=`admin`
- **POS User**: username=`pos`, password=`pos123`, role=`pos`

### 3. Start the Backend

```bash
cd app
uvicorn main:app --reload
```

### 4. Start the Frontend

```bash
cd frontend
npm start
```

## Usage

### Login

1. Access the application - you'll be redirected to the login page
2. Use the default credentials:
   - **Admin**: username=`admin`, password=`admin123`
   - **POS**: username=`pos`, password=`pos123`

### Role-Based Access

#### Admin Role
- Full access to all features
- Can manage admin users (create, edit, delete)
- Access to app administration panel
- Can manage all system settings

#### POS Role
- Limited access for point-of-sale operations
- Can register customers and process checkouts
- Basic user management (view, edit users)
- Cannot access admin user management

### Customer Registration

Customer registration now only requires:
- **Name**: Customer's full name
- **Phone Number**: Contact number for SMS notifications

Email and address fields have been removed as requested.

## Security Features

1. **JWT Tokens**: Secure token-based authentication
2. **Password Hashing**: Bcrypt password hashing
3. **Role-Based Access**: Granular permissions based on user roles
4. **Token Expiration**: Automatic token expiration (30 minutes)
5. **Automatic Logout**: Session management with automatic logout on token expiration

## API Endpoints

### Public Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/register` - Admin user registration (for initial setup)

### Protected Endpoints
- `GET /auth/me` - Get current user info
- `GET /admin/users/` - Get all users (POS/Admin)
- `PUT /admin/user/{id}` - Update user (POS/Admin)
- `DELETE /admin/user/{id}` - Delete user (Admin only)
- `GET /admin/admin-users/` - Get admin users (Admin only)
- `POST /admin/admin-users/` - Create admin user (Admin only)
- `PUT /admin/admin-users/{id}` - Update admin user (Admin only)
- `DELETE /admin/admin-users/{id}` - Delete admin user (Admin only)

## Default Credentials

**Important**: Change these default passwords after first login!

- **Admin**: username=`admin`, password=`admin123`
- **POS**: username=`pos`, password=`pos123`

## Troubleshooting

1. **Database Issues**: Ensure the database is properly initialized with `init_admin_users.py`
2. **Token Issues**: Clear browser localStorage if experiencing authentication problems
3. **Permission Issues**: Verify user role and permissions for specific operations

## Security Recommendations

1. Change default passwords immediately after setup
2. Use strong passwords for admin accounts
3. Regularly rotate admin user passwords
4. Monitor authentication logs
5. Consider implementing rate limiting for login attempts
6. Use HTTPS in production environments
