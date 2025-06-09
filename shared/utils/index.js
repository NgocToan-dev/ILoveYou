// Utility functions for the ILoveYou app

// Export date utilities
export * from './dateUtils';

// Love-themed constants
export const LOVE_COLORS = {
  primary: '#FF69B4',
  secondary: '#FFB6C1',
  accent: '#FF1493',
  dark: '#8B0000',
  light: '#FFE4E6',
  white: '#FFFFFF',
  background: '#FFF0F5',
};

export const LOVE_EMOJIS = {
  heart: '❤️',
  hearts: '💕',
  heartEyes: '😍',
  kiss: '😘',
  couple: '👫',
  ring: '💍',
  flower: '🌹',
  gift: '🎁',
  letter: '💌',
  sparkles: '✨',
  star: '⭐',
  fire: '🔥',
  hundred: '💯',
};

// Validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return {
    isValid: password.length >= 6,
    hasMinLength: password.length >= 6,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };
};

export const validateDisplayName = (name) => {
  return {
    isValid: name.trim().length >= 2 && name.trim().length <= 50,
    hasMinLength: name.trim().length >= 2,
    hasMaxLength: name.trim().length <= 50,
    hasValidChars: /^[a-zA-Z\s'.-]+$/.test(name.trim()),
  };
};

// Love-themed message generators
export const getLoveMessage = () => {
  const messages = [
    'Love is in the air! 💕',
    'You make my heart skip a beat! 💗',
    'Together we are unstoppable! 🔥',
    'Every moment with you is magical! ✨',
    'You are my sunshine! ☀️',
    'Love conquers all! 💪',
    'You complete me! 💝',
    'Forever and always! 💍',
    'You are my happy place! 🌈',
    'Love you to the moon and back! 🌙',
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getLoadingMessage = () => {
  const messages = [
    'Loading your love story...',
    'Spreading love and happiness...',
    'Connecting hearts...',
    'Preparing something special...',
    'Making magic happen...',
    'Crafting your perfect moment...',
    'Sharing the love...',
    'Building beautiful memories...',
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

// User profile helpers
export const getInitials = (name) => {
  if (!name) return '💕';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

export const formatUserName = (user) => {
  if (!user) return 'Unknown User';
  
  if (user.displayName) {
    return user.displayName;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Love User';
};

// App state helpers
export const getAppVersion = () => '1.0.0';

export const getAppName = () => 'ILoveYou';

export const getAppDescription = () => 'A beautiful app designed to celebrate love and connection between couples.';

// Error handling helpers
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (error?.message) {
    // Firebase-specific error handling
    if (error.message.includes('auth/user-not-found')) {
      return 'No account found with this email address.';
    }
    if (error.message.includes('auth/wrong-password')) {
      return 'Incorrect password. Please try again.';
    }
    if (error.message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists.';
    }
    if (error.message.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (error.message.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (error.message.includes('auth/network-request-failed')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Love-themed animations and effects
export const generateHearts = (count = 5) => {
  const hearts = ['💕', '💗', '💖', '💝', '💘'];
  return Array.from({ length: count }, () => 
    hearts[Math.floor(Math.random() * hearts.length)]
  );
};

export const celebrateLove = () => {
  return {
    message: getLoveMessage(),
    hearts: generateHearts(),
    timestamp: new Date().toISOString(),
  };
};

// Navigation helpers
export const resetToAuth = (navigation) => {
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
};

export const resetToMain = (navigation) => {
  navigation.reset({
    index: 0,
    routes: [{ name: 'MainTabs' }],
  });
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: '@ILoveYou:userPreferences',
  AUTH_TOKEN: '@ILoveYou:authToken',
  LOVE_NOTES: '@ILoveYou:loveNotes',
  SETTINGS: '@ILoveYou:settings',
};

// Feature flags
export const FEATURES = {
  MESSAGING_ENABLED: false,
  LOVE_NOTES_ENABLED: false,
  COUPLE_MATCHING_ENABLED: true,
  PREMIUM_FEATURES_ENABLED: false,
};

// Default exports
export default {
  LOVE_COLORS,
  LOVE_EMOJIS,
  validateEmail,
  validatePassword,
  validateDisplayName,
  getLoveMessage,
  getLoadingMessage,
  getInitials,
  formatUserName,
  getAppVersion,
  getAppName,
  getAppDescription,
  getErrorMessage,
  generateHearts,
  celebrateLove,
  resetToAuth,
  resetToMain,
  STORAGE_KEYS,
  FEATURES,
};