import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, defaultLanguage, supportedLanguages } from '@shared/i18n';

// Get saved language from localStorage or use default
const savedLanguage = localStorage.getItem('preferredLanguage');
const initialLanguage = savedLanguage && supportedLanguages.includes(savedLanguage)
  ? savedLanguage
  : defaultLanguage;

// Initialize i18n for web
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferredLanguage', lng);
});

export default i18n;