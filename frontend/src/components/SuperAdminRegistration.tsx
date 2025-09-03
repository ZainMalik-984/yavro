import React, { useState } from 'react';
import {
  PersonAdd,
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
} from '@mui/icons-material';
import { SuperAdminCreate } from '../types';
import { api } from '../services/api';
import './SuperAdminRegistration.css';

interface SuperAdminRegistrationProps {
  onRegistrationSuccess: () => void;
  onBackToLogin: () => void;
}

const SuperAdminRegistration: React.FC<SuperAdminRegistrationProps> = ({
  onRegistrationSuccess,
  onBackToLogin,
}) => {
  const [formData, setFormData] = useState<SuperAdminCreate>({
    username: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.post('/auth/register/super-admin', formData);
      
      setSuccess('Super admin registered successfully! You can now login.');
      
      // Clear form
      setFormData({
        username: '',
        email: '',
        password: '',
      });
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onRegistrationSuccess();
      }, 2000);
      
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-admin-registration-container">
      <div className="super-admin-registration-card">
        <div className="super-admin-registration-header">
          <PersonAdd className="registration-icon" />
          <h2>Super Admin Registration</h2>
          <p>Register a new super admin account</p>
          <p className="note">
            Note: Only the configured super admin email can register
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="username">
              <Person className="input-icon" />
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <Email className="input-icon" />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter email address"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock className="input-icon" />
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter password (min 6 characters)"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock className="input-icon" />
              Confirm Password
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="back-button"
              onClick={onBackToLogin}
              disabled={loading}
            >
              Back to Login
            </button>
            
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Registering...
                </>
              ) : (
                <>
                  <PersonAdd className="button-icon" />
                  Register Super Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminRegistration;

