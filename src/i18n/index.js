import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import vi from './locales/vi.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
        // Fall back to device language
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      
      // Check if we support the device language
      const supportedLanguage = ['en', 'vi'].includes(deviceLanguage) ? deviceLanguage : 'en';
      callback(supportedLanguage);
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('en'); // Default fallback
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Error caching user language:', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      vi: {
        translation: vi,
      },
    },
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // Not needed for React Native
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper function to change language
export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem('user-language', language);
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.log('Error changing language:', error);
    return false;
  }
};

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language;

// Helper function to get available languages
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];