import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CircularProgress from '@mui/material/CircularProgress';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Button from '@mui/material/Button';
import { recognizeUser } from '../services/api';
import { User } from '../types';
import './CameraCapture.css';

interface CameraCaptureProps {
  onUserRecognized: (user: User) => void;
  onUserNotFound: (imageSrc: string) => void;
  onPhoneSearch: () => void;
  onRegisterWithoutImage: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onUserRecognized,
  onUserNotFound,
  onPhoneSearch,
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
          <Button
            onClick={capture}
            disabled={isLoading}
            variant="contained"
            className='capture-button'
            sx={{
              background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%)',
              color: '#f5deb3',
              padding: '15px 25px',
              borderRadius: '40px',
              fontSize: '1.1rem',
              fontWeight: 700,
              minWidth: '180px',
              height: 'auto',
              textTransform: 'none',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 69, 19, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(139, 69, 19, 0.4)'
              },
              '&:disabled': {
                opacity: 0.7
              }
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: '#f5deb3' }} />
                <span style={{ marginLeft: '8px' }}>Recognizing...</span>
              </>
            ) : (
              <>
                <CameraAltIcon sx={{ fontSize: '1.2rem' }} />
                <span style={{ marginLeft: '8px' }}>Capture & Recognize</span>
              </>
            )}
          </Button>
        </div>

        <div className='alternative-actions'>
          <Button
            onClick={onPhoneSearch}
            disabled={isLoading}
            variant="outlined"
            startIcon={<PhoneIcon />}
            className='phone-search-button'
            sx={{
              height: '50px',
              borderRadius: '25px',
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderColor: '#e0e0e0',
              color: '#666',
              backgroundColor: '#f8f9fa',
              '&:hover': {
                backgroundColor: '#e9ecef',
                borderColor: '#d1d5db',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            Search by Phone
          </Button>
          
          <Button
            onClick={onRegisterWithoutImage}
            disabled={isLoading}
            variant="contained"
            startIcon={<PersonAddIcon />}
            className='register-no-image-button'
            sx={{
              height: '50px',
              borderRadius: '25px',
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #2c1810 0%, #3d2314 100%)',
              color: '#cd853f',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 69, 19, 0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #3d2314 0%, #4a2c1a 100%)',
                color: '#deb887',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(139, 69, 19, 0.3)'
              }
            }}
          >
            Register Without Image
          </Button>
        </div>

        {error && <div className='error-message'>{error}</div>}

      </div>
    </div>
  );
};

export default CameraCapture;
