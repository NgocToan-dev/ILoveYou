import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    // Store the language preference in localStorage
    localStorage.setItem('preferredLanguage', language);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const isVietnamese = () => {
    return i18n.language === 'vi';
  };

  const isEnglish = () => {
    return i18n.language === 'en';
  };

  return {
    changeLanguage,
    getCurrentLanguage,
    isVietnamese,
    isEnglish,
    currentLanguage: i18n.language,
  };
};