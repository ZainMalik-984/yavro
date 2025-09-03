import React, { useState } from 'react';
import {
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';
import { AdminUserLogin, Token } from '../types';
import { api } from '../services/api';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (token: Token) => void;
  onShowSuperAdminRegistration: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onShowSuperAdminRegistration }) => {
  const [formData, setFormData] = useState<AdminUserLogin>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/auth/login', formData);
      const token: Token = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token.access_token);
      localStorage.setItem('user', JSON.stringify(token.user));
      
      // Update API headers with token
      api.defaults.headers.common['Authorization'] = `Bearer ${token.access_token}`;
      
      onLoginSuccess(token);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Lock className="login-icon" />
          <h2>Admin Login</h2>
          <p>Enter your credentials to access the system</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
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

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                Logging in...
              </>
            ) : (
              <>
                <LoginIcon className="button-icon" />
                Login
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="super-admin-link"
            onClick={onShowSuperAdminRegistration}
            disabled={loading}
          >
            Register Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
