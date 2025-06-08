# Technical Context & Implementation Details

## Current Technology Stack

### Core Framework
- **React Native**: 0.79.3 (Latest stable)
- **Expo**: 53.0.10 (Managed workflow)
- **React**: 19.0.0
- **Node.js**: Compatible with Expo requirements

### Navigation & UI
- **React Navigation**: 7.x
  - `@react-navigation/native`: 7.1.10
  - `@react-navigation/stack`: 7.3.3
  - `@react-navigation/bottom-tabs`: 7.3.14
- **Expo Linear Gradient**: 14.1.5 (For romantic backgrounds)
- **Expo Vector Icons**: Built-in Ionicons for UI
- **React Native Gesture Handler**: 2.24.0

### Backend & Data
- **Firebase**: 11.9.0
  - Firestore (Database)
  - Authentication
  - Storage (planned for media)
- **AsyncStorage**: 2.1.2 (Local data persistence)

### Development Tools
- **Babel Core**: 7.27.4
- **Metro**: Built-in bundler
- **Expo CLI**: Development and build tooling

## Development Environment Setup

### Prerequisites
```bash
# Node.js (LTS version)
node --version  # Should be 18.x or 20.x

# Expo CLI
npm install -g @expo/cli

# Dependencies installation
npm install
```

### Project Structure
```
e:/Workspace/ILoveYou/
├── App.js                 # Root application component
├── index.js              # Entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── metro.config.js       # Metro bundler config
├── assets/               # Static assets (images, fonts)
└── src/                  # Source code (detailed in systemPatterns.md)
```

### Firebase Configuration
Located in [`src/services/firebase/config.js`](src/services/firebase/config.js:1)
- Firestore database connection
- Authentication setup
- Storage configuration (for future media features)

## Current Dependencies Analysis

### Production Dependencies
```json
{
  "@react-native-async-storage/async-storage": "2.1.2",  // Local storage
  "@react-navigation/bottom-tabs": "^7.3.14",            // Tab navigation
  "@react-navigation/native": "^7.1.10",                 // Core navigation
  "@react-navigation/stack": "^7.3.3",                   // Stack navigation
  "expo": "^53.0.10",                                     // Expo framework
  "expo-constants": "^17.1.6",                           // App constants
  "expo-font": "^13.3.1",                                // Font loading
  "expo-linear-gradient": "^14.1.5",                     // Gradient backgrounds
  "expo-splash-screen": "^0.30.9",                       // Splash screen
  "expo-status-bar": "^2.2.3",                           // Status bar control
  "firebase": "^11.9.0",                                 // Firebase SDK
  "react": "19.0.0",                                     // React core
  "react-native": "^0.79.3",                             // React Native
  "react-native-gesture-handler": "~2.24.0",             // Gesture handling
  "react-native-safe-area-context": "5.4.0",             // Safe area
  "react-native-screens": "^4.11.1"                      // Screen optimization
}
```

### Required Dependencies for New Features

#### Notes System
```bash
# Rich text editing (optional)
npm install react-native-paper  # Material design components

# Image handling
expo install expo-image-picker
expo install expo-media-library

# Voice recording
expo install expo-av
```

#### Reminders System
```bash
# Push notifications
expo install expo-notifications

# Calendar integration
expo install expo-calendar

# Date/time handling
npm install date-fns  # or moment.js
```

#### Vietnamese i18n
```bash
# Internationalization
npm install react-native-localize
npm install i18n-js
```

#### UI Enhancements
```bash
# Advanced animations
npm install react-native-reanimated

# Additional icons
expo install @expo/vector-icons
```

## Firebase Architecture

### Current Collections
```javascript
// Firestore structure
{
  users: {
    [userId]: {
      displayName: string,
      email: string,
      bio: string,
      phoneNumber: string,
      createdAt: Timestamp
    }
  },
  couples: {
    [coupleId]: {
      members: [userId1, userId2],
      createdAt: Timestamp
    }
  },
  messages: {
    [messageId]: {
      participants: [userId1, userId2],
      senderId: string,
      content: string,
      timestamp: Timestamp
    }
  }
}
```

### Planned Collections for New Features
```javascript
// Additional Firestore collections needed
{
  notes: {
    [noteId]: {
      type: 'private' | 'shared',
      authorId: string,
      coupleId: string,         // For shared notes
      category: string,
      title: string,
      content: string,
      mediaUrls: [string],      // Firebase Storage URLs
      tags: [string],
      createdAt: Timestamp,
      updatedAt: Timestamp,
      sharedWith: [string]      // User IDs for shared notes
    }
  },
  reminders: {
    [reminderId]: {
      type: 'personal' | 'couple',
      creatorId: string,
      coupleId: string,         // For couple reminders
      title: string,
      description: string,
      dueDate: Timestamp,
      recurring: {
        enabled: boolean,
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
        interval: number
      },
      notificationSettings: {
        enabled: boolean,
        reminderTime: number    // Minutes before due date
      },
      completed: boolean,
      completedAt: Timestamp,
      createdAt: Timestamp
    }
  },
  peacefulDays: {
    [coupleId]: {
      currentStreak: number,
      longestStreak: number,
      lastResetDate: Timestamp,
      lastIncrementDate: Timestamp,
      milestones: [{
        days: number,
        achievedAt: Timestamp,
        celebrated: boolean
      }]
    }
  },
  i18nSettings: {
    [userId]: {
      language: 'en' | 'vi',
      dateFormat: string,
      timezone: string
    }
  }
}
```

## Performance Considerations

### Current Optimizations
- Navigation state persistence
- Efficient Firestore queries with proper indexing
- Real-time listeners only where needed
- Proper cleanup of subscriptions

### Planned Optimizations for New Features
```javascript
// Firestore indexes needed
// Collection: notes
// Fields: authorId, type, createdAt (descending)
// Fields: coupleId, type, createdAt (descending)

// Collection: reminders  
// Fields: creatorId, dueDate (ascending)
// Fields: coupleId, dueDate (ascending)
```

### Memory Management
- Image optimization for note attachments
- Pagination for large note collections
- Efficient caching strategies

## Security Implementation

### Current Security Measures
- Firebase Authentication required for all operations
- User-specific data access patterns
- Proper error handling to avoid data leaks

### Enhanced Security for New Features
```javascript
// Firestore Security Rules (recommended)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notes access control
    match /notes/{noteId} {
      allow read, write: if request.auth != null && (
        resource.data.authorId == request.auth.uid ||
        request.auth.uid in resource.data.sharedWith
      );
    }
    
    // Reminders access control
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && (
        resource.data.creatorId == request.auth.uid ||
        (resource.data.type == 'couple' && 
         resource.data.coupleId in getUserCouples(request.auth.uid))
      );
    }
    
    // Peaceful days access control
    match /peacefulDays/{coupleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in getCoupleMembers(coupleId);
    }
  }
}
```

## Build & Deployment

### Current Build Configuration
```json
// app.json
{
  "expo": {
    "name": "iloveyou",
    "slug": "iloveyou",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "orientation": "portrait",
    "splash": {
      "backgroundColor": "#F8BBD9"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.iloveyou"
    },
    "android": {
      "package": "com.yourcompany.iloveyou"
    }
  }
}
```

### Enhanced Build Configuration for New Features
```json
// Additional app.json configuration needed
{
  "expo": {
    "permissions": [
      "NOTIFICATIONS",
      "CAMERA",
      "MEDIA_LIBRARY",
      "AUDIO_RECORDING"
    ],
    "notification": {
      "iosDisplayInForeground": true
    },
    "plugins": [
      "expo-notifications"
    ]
  }
}
```

## Development Workflow

### Current Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android", 
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

### Testing Strategy (Recommended)
```bash
# Unit testing
npm install --save-dev jest react-test-renderer

# Component testing
npm install --save-dev @testing-library/react-native

# Firebase testing
npm install --save-dev @firebase/testing
```

## Internationalization Setup

### i18n Implementation Plan
```javascript
// i18n configuration structure
import I18n from 'i18n-js';
import * as Localization from 'expo-localization';

// Language files
const translations = {
  en: require('./locales/en.json'),
  vi: require('./locales/vi.json')
};

I18n.translations = translations;
I18n.locale = Localization.locale;
I18n.fallbacks = true;

export default I18n;
```

### Vietnamese Language Considerations
- **Text Direction**: Left-to-right (same as English)
- **Date Format**: DD/MM/YYYY (different from US format)
- **Currency**: Vietnamese Dong (VND) - if needed for premium features
- **Cultural Phrases**: Respectful and romantic terminology
- **Font Support**: Ensure proper Vietnamese character display

## Monitoring & Analytics

### Performance Monitoring (Recommended)
```bash
# Firebase Performance Monitoring
npm install @react-native-firebase/perf

# Crash reporting
npm install @react-native-firebase/crashlytics

# Analytics
npm install @react-native-firebase/analytics
```

### Development Debugging
- **Flipper**: React Native debugging (built-in with Expo dev client)
- **Firebase Emulator Suite**: Local development environment
- **React Native Debugger**: Enhanced debugging tools

## Technical Debt & Improvements

### Current Technical Debt
- No comprehensive testing suite
- Limited error boundary coverage
- Basic offline handling
- Manual dependency version management

### Planned Improvements
1. **Testing Infrastructure**: Comprehensive test coverage
2. **Performance Monitoring**: Real-time performance tracking
3. **Offline Capabilities**: Enhanced offline-first design
4. **CI/CD Pipeline**: Automated testing and deployment
5. **Code Quality**: ESLint, Prettier, TypeScript migration consideration