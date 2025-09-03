import React, { useState, useRef } from 'react';
import { PersonAdd, ArrowBack, Person, Phone } from '@mui/icons-material';
import { Checkbox, Button } from '@mui/material';
import { registerUser, registerUserWithoutImage } from '../services/api';
import { User, UserCreate } from '../types';
import './UserRegistration.css';

interface UserRegistrationProps {
  capturedImage?: string;
  onRegistrationComplete: (user: User) => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({
  capturedImage,
  onRegistrationComplete,
  onBack,
  isLoading,
  setIsLoading,
}) => {
  const [formData, setFormData] = useState<UserCreate>({
    name: '',
    phone_number: '',
  });
  const [error, setError] = useState<string>('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePrivacyConsentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPrivacyConsent(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone_number || !privacyConsent) {
      setError(
        'Please fill in all customer information and accept the privacy policy'
      );
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let user: User;

      if (capturedImage) {
        // Register with image
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
        user = await registerUser(file, formData);
      } else {
        // Register without image
        user = await registerUserWithoutImage(formData);
      }

      onRegistrationComplete(user);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.detail || err.message || 'Registration failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='user-registration'>
      <div className='registration-container'>
        <h2>
          <PersonAdd className='header-icon' />
          Customer Registration
        </h2>

        <div className='registration-content'>
          <div className='form-section'>
            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <label htmlFor='name'>
                  <Person className='label-icon' />
                  Full Name *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer's full name"
                />
              </div>

              <div className='form-group'>
                <label htmlFor='phone_number'>
                  <Phone className='label-icon' />
                  Phone Number *
                </label>
                <input
                  type='tel'
                  id='phone_number'
                  name='phone_number'
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer's phone number"
                />
              </div>

              <div className='form-group privacy-consent-group'>
                <div
                  className='privacy-checkbox-container'
                  style={{ alignItems: 'center' }}
                >
                  <Checkbox
                    id='privacy_consent'
                    name='privacy_consent'
                    checked={privacyConsent}
                    onChange={handlePrivacyConsentChange}
                    required
                    size='small'
                    sx={{
                      color: '#deb887',
                      '&.Mui-checked': {
                        color: '#deb887',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(139, 69, 19, 0.1)',
                      },
                      padding: '2px',
                      marginTop: '2px',
                    }}
                  />
                  <label
                    htmlFor='privacy_consent'
                    className='privacy-label'
                    style={{ marginBottom: '0px !important' }}
                  >
                    <span>
                      I agree to the{' '}
                      <button
                        type='button'
                        className='privacy-policy-link'
                        onClick={() => setShowPrivacyPolicy(true)}
                      >
                        Privacy Policy
                      </button>
                      *
                    </span>
                  </label>
                </div>
              </div>

              {error && <div className='error-message'>{error}</div>}

              <div className='form-actions'>
                <Button
                  type='button'
                  onClick={onBack}
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  disabled={isLoading}
                  sx={{
                    height: '50px',
                    borderRadius: '25px',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderColor: '#e0e0e0',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    padding: '12px 20px',
                    '&:hover': {
                      backgroundColor: '#e9ecef',
                      borderColor: '#d1d5db',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                    },
                    '&:disabled': {
                      opacity: 0.6
                    }
                  }}
                >
                  Back
                </Button>
                <Button
                  type='submit'
                  variant="contained"
                  startIcon={!isLoading ? <PersonAdd /> : null}
                  disabled={isLoading}
                  sx={{
                    height: '50px',
                    borderRadius: '25px',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                    color: 'white',
                    padding: '12px 20px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 69, 19, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #A0522D 0%, #CD853F 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(139, 69, 19, 0.3)'
                    },
                    '&:disabled': {
                      opacity: 0.7
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className='loading-spinner' />
                      Processing...
                    </>
                  ) : (
                    capturedImage
                      ? 'Register Customer'
                      : 'Register Without Image'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Privacy Policy Modal */}
        {showPrivacyPolicy && (
          <div
            className='privacy-modal-overlay'
            onClick={() => setShowPrivacyPolicy(false)}
          >
            <div className='privacy-modal' onClick={e => e.stopPropagation()}>
              <div className='privacy-modal-header'>
                <h3>Privacy Policy</h3>
                <button
                  className='privacy-modal-close'
                  onClick={() => setShowPrivacyPolicy(false)}
                >
                  ×
                </button>
              </div>
              <div className='privacy-modal-content'>
                <p>
                  By logging in, you allow Yavro to store your visit data for
                  rewards, discounts, and service improvements. Your data is
                  never sold or shared, kept only as long as needed, and you may
                  request correction or deletion anytime.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRegistration;
