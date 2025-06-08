import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getAvailableLanguages, getCurrentLanguage } from '../../i18n';

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const currentLanguage = getCurrentLanguage();
  const languages = getAvailableLanguages();

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) return;

    setLoading(true);
    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        Alert.alert(
          t('settings.language.changeSuccess'),
          '',
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('settings.language.changeError'),
          '',
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Language change error:', error);
      Alert.alert(
        t('settings.language.changeError'),
        '',
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.language.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.language.subtitle')}</Text>
      </View>

      <View style={styles.languageList}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              currentLanguage === language.code && styles.selectedLanguage,
            ]}
            onPress={() => handleLanguageChange(language.code)}
            disabled={loading}
          >
            <View style={styles.languageInfo}>
              <Text
                style={[
                  styles.languageName,
                  currentLanguage === language.code && styles.selectedText,
                ]}
              >
                {language.nativeName}
              </Text>
              <Text
                style={[
                  styles.languageSecondary,
                  currentLanguage === language.code && styles.selectedSecondaryText,
                ]}
              >
                {language.name}
              </Text>
            </View>

            <View style={styles.languageAction}>
              {loading && currentLanguage !== language.code ? (
                <ActivityIndicator size="small" color="#E91E63" />
              ) : currentLanguage === language.code ? (
                <Ionicons name="checkmark-circle" size={24} color="#E91E63" />
              ) : (
                <Ionicons name="chevron-forward" size={24} color="#F8BBD9" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A01050',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F8BBD9',
  },
  selectedLanguage: {
    borderColor: '#E91E63',
    backgroundColor: '#FFF5F8',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedText: {
    color: '#A01050',
  },
  languageSecondary: {
    fontSize: 14,
    color: '#666',
  },
  selectedSecondaryText: {
    color: '#C2185B',
  },
  languageAction: {
    marginLeft: 12,
  },
});

export default LanguageSwitcher;