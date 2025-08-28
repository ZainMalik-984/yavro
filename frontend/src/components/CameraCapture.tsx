import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CircularProgress from '@mui/material/CircularProgress';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { recognizeUser } from '../services/api';
import { User } from '../types';
import './CameraCapture.css';

interface CameraCaptureProps {
  onUserRecognized: (user: User) => void;
  onUserNotFound: (imageSrc: string) => void;
  onEmailSearch: () => void;
  onRegisterWithoutImage: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onUserRecognized,
  onUserNotFound,
  onEmailSearch,
  onRegisterWithoutImage,
  isLoading,
  setIsLoading,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string>('');

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsLoading(true);
    setError('');

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Convert base64 to file
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });

      // Try to recognize user
      const user = await recognizeUser(file);
      onUserRecognized(user);
    } catch (err: any) {
      console.error('Recognition error:', err);

      if (err.response?.status === 404) {
        // User not found - this is expected for new customers
        onUserNotFound(webcamRef.current?.getScreenshot() || '');
      } else {
        setError(
          err.response?.data?.detail ||
            err.message ||
            'Failed to recognize user'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [onUserRecognized, onUserNotFound, setIsLoading]);

  return (
    <div className='camera-capture'>
      <div className='camera-container'>
        <Webcam
          ref={webcamRef}
          screenshotFormat='image/jpeg'
          width={400}
          height={300}
          className='webcam'
        />
        <div className='camera-controls'>
          <button
            onClick={capture}
            disabled={isLoading}
            className='capture-button'
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} className='button-icon' />
                <span>Recognizing...</span>
              </>
            ) : (
              <>
                <CameraAltIcon className='button-icon' />
              </>
            )}
          </button>
        </div>

        <div className='alternative-actions'>
          <button
            onClick={onEmailSearch}
            disabled={isLoading}
            className='email-search-button'
          >
            <EmailIcon className='button-icon' />
            <span>Search by Email</span>
          </button>
          
          <button
            onClick={onRegisterWithoutImage}
            disabled={isLoading}
            className='register-no-image-button'
          >
            <PersonAddIcon className='button-icon' />
            <span>Register Without Image</span>
          </button>
        </div>

        {error && <div className='error-message'>{error}</div>}

      </div>
    </div>
  );
};

export default CameraCapture;
