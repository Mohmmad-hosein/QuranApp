import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  fontSize: string;
  setFontSize: (size: string) => void;
  fontType: string;
  setFontType: (type: string) => void;
  color: string;
  setColor: (color: string) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  fontSize: "20",
  setFontSize: () => {},
  fontType: "ایران سنس",
  setFontType: () => {},
  color: "آبی",
  setColor: () => {},
});

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [fontSize, setFontSize] = useState<string>("20");
  const [fontType, setFontType] = useState<string>("ایران سنس");
  const [color, setColor] = useState<string>("آبی");

  // ذخیره تنظیمات در AsyncStorage
  const saveSettings = async () => {
    try {
      const settings = { fontSize, fontType, color };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setFontSize(parsedSettings.fontSize);
        setFontType(parsedSettings.fontType);
        setColor(parsedSettings.color);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [fontSize, fontType, color]);

  return (
    <SettingsContext.Provider
      value={{
        fontSize,
        setFontSize,
        fontType,
        setFontType,
        color,
        setColor,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
