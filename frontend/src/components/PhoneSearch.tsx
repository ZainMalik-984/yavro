import React, { useState } from 'react';
import {
  Phone,
  Search,
  PersonAdd,
  ArrowBack,
} from '@mui/icons-material';
import { getUserByPhone } from '../services/api';
import { User } from '../types';
import './PhoneSearch.css';

interface PhoneSearchProps {
  onUserFound: (user: User) => void;
  onUserNotFound: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PhoneSearch: React.FC<PhoneSearchProps> = ({
  onUserFound,
  onUserNotFound,
  onBack,
  isLoading,
  setIsLoading,
}) => {
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await getUserByPhone(phone.trim());
      onUserFound(user);
    } catch (err: any) {
      console.error('Phone search error:', err);
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
    <div className='phone-search'>
      <div className='search-container'>
        <h2>
          <Phone className='header-icon' />
          Search by Phone
        </h2>

        <div className='search-content'>
          <form onSubmit={handleSubmit}>
            <div className='form-group'>
              <label htmlFor='phone'>
                <Phone className='label-icon' />
                Phone Number *
              </label>
              <input
                type='tel'
                id='phone'
                name='phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Enter customer's phone number"
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

export default PhoneSearch;
