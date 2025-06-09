import i18n from 'i18next';

// Language resources
import en from './locales/en.json';
import vi from './locales/vi.json';

export const resources = {
  en: { translation: en },
  vi: { translation: vi }
};

export const defaultLanguage = 'vi';
export const supportedLanguages = ['vi', 'en'];

// Platform-specific initialization will be done in mobile/web apps
export { i18n };