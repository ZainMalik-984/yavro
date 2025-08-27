import React, { useState } from 'react';
import {
  Email,
  Search,
  PersonAdd,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { getUserByEmail } from '../services/api';
import { User } from '../types';
import './EmailSearch.css';

interface EmailSearchProps {
  onUserFound: (user: User) => void;
  onUserNotFound: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const EmailSearch: React.FC<EmailSearchProps> = ({
  onUserFound,
  onUserNotFound,
  onBack,
  isLoading,
  setIsLoading,
}) => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await getUserByEmail(email.trim());
      onUserFound(user);
    } catch (err: any) {
      console.error('Email search error:', err);
      if (err.response?.status === 404) {
        // User not found - this is expected for new customers
        onUserNotFound();
      } else {
        setError(
          err.response?.data?.detail || err.message || 'Failed to find user'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='email-search'>
      <div className='search-container'>
        <h2>
          <Email className='header-icon' />
          Search by Email
        </h2>

        <div className='search-content'>
          <form onSubmit={handleSubmit}>
            <div className='form-group'>
              <label htmlFor='email'>
                <Email className='label-icon' />
                Email Address *
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter customer's email address"
                disabled={isLoading}
              />
            </div>

            {error && <div className='error-message'>{error}</div>}

            <div className='form-actions'>
              <button
                type='button'
                onClick={onBack}
                className='back-button'
                disabled={isLoading}
              >
                <ArrowBack className='button-icon' />
                Back
              </button>
              <button
                type='submit'
                className='search-button'
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className='loading-spinner' />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className='button-icon' />
                    Search Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailSearch;
