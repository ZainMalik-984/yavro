import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAppSettings } from '../services/api';

interface AppSettings {
  cafe_name: string;
  cafe_tagline: string;
  cafe_logo_base64: string | null;
}

interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  cafe_name: 'Yavro Cafe',
  cafe_tagline: 'Brewing Connections, One Cup at a Time',
  cafe_logo_base64: null
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAppSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading app settings:', error);
      // Keep default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const value = {
    settings,
    loading,
    refreshSettings
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};
