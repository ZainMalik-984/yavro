import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
  CameraAlt,
  PersonAdd,
  ArrowBack,
  CheckCircle,
  PhotoCamera,
  Person,
  Email,
  Home,
  Phone,
} from '@mui/icons-material';
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
    email: '',
    address: '',
    phone_number: '',
  });
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

    if (
      !formData.name ||
      !formData.email ||
      !formData.address ||
      !formData.phone_number
    ) {
      setError('Please fill in all customer information');
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
                <label htmlFor='email'>
                  <Email className='label-icon' />
                  Email *
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer's email"
                />
              </div>

              <div className='form-group'>
                <label htmlFor='address'>
                  <Home className='label-icon' />
                  Address *
                </label>
                <input
                  type='text'
                  id='address'
                  name='address'
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer's address"
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
                  className='register-button'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className='loading-spinner' />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PersonAdd className='button-icon' />
                      {capturedImage ? 'Register Customer' : 'Register Without Image'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
