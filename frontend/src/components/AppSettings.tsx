import React, { useState, useEffect } from 'react';
import './AppSettings.css';
import { updateAppSettings, uploadCafeLogo } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { 
  Settings as SettingsIcon,
  Store as StoreIcon,
  Chat as ChatIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

interface AppSettingsData {
  cafe_name: string;
  cafe_tagline: string;
  cafe_logo_base64: string | null;
}

const AppSettings: React.FC = () => {
  const { settings: contextSettings, refreshSettings } = useAppSettings();
  const [settings, setSettings] = useState<AppSettingsData>({
    cafe_name: 'Yavro Cafe',
    cafe_tagline: 'Brewing Connections, One Cup at a Time',
    cafe_logo_base64: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (contextSettings) {
      setSettings({
        cafe_name: contextSettings.cafe_name,
        cafe_tagline: contextSettings.cafe_tagline,
        cafe_logo_base64: contextSettings.cafe_logo_base64,
      });
      if (contextSettings.cafe_logo_base64) {
        setPreviewUrl(contextSettings.cafe_logo_base64);
      }
    }
  }, [contextSettings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      await refreshSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Error loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AppSettingsData, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage('');

      // Update text settings
      await updateAppSettings({
        cafe_name: settings.cafe_name,
        cafe_tagline: settings.cafe_tagline,
      });

      // Upload logo if selected
      if (selectedFile) {
        await uploadCafeLogo(selectedFile);
      }

      setMessage('Settings saved successfully!');
      setSelectedFile(null);
      await refreshSettings(); // Refresh context
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      cafe_name: 'Yavro Cafe',
      cafe_tagline: 'Brewing Connections, One Cup at a Time',
      cafe_logo_base64: null,
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setMessage('');
  };

  return (
    <div className='app-settings'>
      <h2>
        <SettingsIcon sx={{ marginRight: 2, fontSize: 32 }} />
        Cafe Branding Settings
      </h2>

      {message && (
        <div
          className={`message ${message.includes('Error') ? 'error' : 'success'}`}
        >
          {message.includes('Error') ? (
            <ErrorIcon sx={{ marginRight: 1, fontSize: 20 }} />
          ) : (
            <CheckCircleIcon sx={{ marginRight: 1, fontSize: 20 }} />
          )}
          {message}
        </div>
      )}

      <div className='settings-form'>
        <div className='form-group'>
          <label htmlFor='cafe-name'>
            <StoreIcon sx={{ marginRight: 1, fontSize: 20 }} />
            Cafe Name
          </label>
          <input
            type='text'
            id='cafe-name'
            value={settings.cafe_name}
            onChange={e => handleInputChange('cafe_name', e.target.value)}
            placeholder='Enter your cafe name'
          />
        </div>

        <div className='form-group'>
          <label htmlFor='cafe-tagline'>
            <ChatIcon sx={{ marginRight: 1, fontSize: 20 }} />
            Cafe Tagline
          </label>
          <input
            type='text'
            id='cafe-tagline'
            value={settings.cafe_tagline}
            onChange={e => handleInputChange('cafe_tagline', e.target.value)}
            placeholder='Enter your cafe tagline or slogan'
          />
        </div>

        <div className='form-group'>
          <label htmlFor='logo-upload'>
            <ImageIcon sx={{ marginRight: 1, fontSize: 20 }} />
            Cafe Logo
          </label>
          <div className='logo-upload-section'>
            <input
              type='file'
              id='logo-upload'
              accept='image/*'
              onChange={handleFileSelect}
              className='file-input'
            />
            <label htmlFor='logo-upload' className='file-input-label'>
              <CloudUploadIcon sx={{ marginRight: 1, fontSize: 20 }} />
              Choose Logo
            </label>
            {previewUrl && (
              <div className='logo-preview'>
                <img src={previewUrl} alt='Logo preview' />
              </div>
            )}
          </div>
        </div>

        <div className='form-actions'>
          <button
            type='button'
            onClick={handleSave}
            disabled={isLoading}
            className='save-button'
          >
            {isLoading ? (
              'Saving...'
            ) : (
              <>
                <SaveIcon sx={{ marginRight: 1, fontSize: 20 }} />
                Save Settings
              </>
            )}
          </button>
          <button
            type='button'
            onClick={handleReset}
            disabled={isLoading}
            className='reset-button'
          >
            <RefreshIcon sx={{ marginRight: 1, fontSize: 20 }} />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;
