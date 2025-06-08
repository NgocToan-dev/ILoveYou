# System Patterns & Architecture

## Current Technical Architecture

### Technology Stack
```
Frontend: React Native (0.79.3) + Expo (53.0.10)
Backend: Firebase v11.9.0
  ├── Authentication (Firebase Auth)
  ├── Database (Firestore)
  ├── Storage (Firebase Storage - not yet implemented)
Navigation: React Navigation v7
  ├── Stack Navigator (Auth & Feature screens)
  └── Bottom Tab Navigator (Main app)
State Management: React Hooks + Context
UI Framework: Custom Love-themed components
```

### Application Structure
```
src/
├── components/          # Reusable UI components
│   ├── index.js        # Component exports
│   └── ui/             # Love-themed UI components
│       ├── LoveBackground.js
│       ├── LoveButton.js
│       ├── LoveInput.js
│       ├── LoadingIndicator.js
│       └── UserProfileCard.js
├── navigation/         # Navigation configuration
│   ├── AppNavigator.js # Main navigation logic
│   └── index.js        # Navigation exports
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── user/           # User management screens
│   ├── MessagesScreen.js
│   └── SettingsScreen.js
├── services/           # External service integrations
│   └── firebase/       # Firebase operations
│       ├── auth.js     # Authentication logic
│       ├── config.js   # Firebase configuration
│       └── firestore.js # Database operations
└── utils/              # Utility functions
    ├── dateUtils.js    # Date formatting helpers
    └── index.js        # Utility exports
```

## Design Patterns & Principles

### Component Design Patterns

#### 1. Love-Themed Component System
All UI components follow a romantic design pattern:
- **LoveBackground**: Gradient background with floating hearts
- **LoveButton**: Pink-themed buttons with heart icons
- **LoveInput**: Romantic input fields with love styling
- **Consistent Color Palette**: Pink gradients (#F8BBD9, #F48FB1, #FCE4EC)

#### 2. Error Boundary Pattern
Global error handling with romantic messaging:
```javascript
// Implemented in App.js
<ErrorBoundary>
  <AppNavigator />
</ErrorBoundary>
```

#### 3. Loading State Pattern
Consistent loading indicators with love messages:
```javascript
<LoadingIndicator 
  message="Loading your love story..." 
  size="large" 
/>
```

### Data Flow Patterns

#### 1. Firebase Service Layer
Clean separation between UI and Firebase operations:
```javascript
// services/firebase/firestore.js
export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), userData);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};
```

#### 2. Error Handling Pattern
Consistent error return structure:
```javascript
// All Firebase operations return { data, error }
const { user, error } = await getUser(userId);
if (error) {
  // Handle error
} else {
  // Use data
}
```

#### 3. Real-time Data Pattern
Firestore listeners for live updates:
```javascript
export const subscribeToMessages = (userId, partnerId, callback) => {
  return onSnapshot(query, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};
```

### Navigation Patterns

#### 1. Authenticated vs Unauthenticated Flow
```javascript
// AppNavigator.js
{user ? <MainTabs /> : <AuthStack />}
```

#### 2. Stack Navigation Within Tabs
Each tab contains its own stack navigator:
- Profile Tab → UserStack (Profile, Edit, Delete)
- Messages Tab → MessagesStack
- Settings Tab → SettingsStack

#### 3. Deep Linking Support
```javascript
const linking = {
  prefixes: ["iloveyou://"],
  config: {
    screens: {
      Auth: { screens: { Login: "login" } },
      Main: { screens: { Profile: "profile" } }
    }
  }
};
```

## Current Data Models

### User Model
```javascript
{
  id: "firebase_user_id",
  displayName: "User Name",
  email: "user@example.com",
  bio: "Personal bio",
  phoneNumber: "phone",
  createdAt: Timestamp,
  // Future: profilePhoto, preferences
}
```

### Couple Model
```javascript
{
  id: "couple_document_id",
  members: ["user_id_1", "user_id_2"],
  createdAt: Timestamp,
  // Future: anniversary, shared_settings
}
```

### Message Model
```javascript
{
  id: "message_document_id",
  participants: ["user_id_1", "user_id_2"],
  senderId: "user_id",
  content: "message text",
  timestamp: Timestamp,
  // Future: type, media, reactions
}
```

## Architecture Principles

### 1. Couple-Centric Design
- All features designed for two-person usage
- Shared data models with privacy controls
- Partner-aware UI and UX patterns

### 2. Privacy by Design
- User-controlled access permissions
- Clear distinction between private and shared content
- Secure data handling patterns

### 3. Romantic User Experience
- Love-themed visual design throughout
- Emotional language in all user interactions
- Celebration-focused feature design

### 4. Scalable Firebase Architecture
- Efficient query patterns
- Proper indexing for performance
- Cost-effective data structure design

### 5. Component Reusability
- Consistent UI component library
- Themeable design system
- Modular screen construction

## Performance Patterns

### 1. Lazy Loading
```javascript
// Navigation state persistence
const PERSISTENCE_KEY = "NAVIGATION_STATE_V1";
```

### 2. Efficient Firestore Queries
```javascript
// Indexed queries with proper ordering
const q = query(
  collection(db, 'messages'),
  where('participants', 'array-contains-any', [userId, partnerId]),
  orderBy('timestamp', 'desc')
);
```

### 3. Real-time Optimization
- Firestore listeners only where needed
- Proper cleanup of subscriptions
- Efficient re-render patterns

## Security Patterns

### 1. Firebase Security Rules (Recommended)
```javascript
// Firestore rules for user privacy
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /couples/{coupleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
    }
  }
}
```

### 2. Authentication State Management
```javascript
// Global auth state with proper cleanup
useEffect(() => {
  const unsubscribe = onAuthStateChange((authUser) => {
    setUser(authUser);
    setLoading(false);
  });
  return unsubscribe;
}, []);
```

## Code Quality Patterns

### 1. Consistent Error Handling
All async operations follow the same error pattern:
```javascript
try {
  // Firebase operation
  return { data, error: null };
} catch (error) {
  return { data: null, error: error.message };
}
```

### 2. Component Organization
- Clear separation of concerns
- Reusable UI components in dedicated folder
- Screen-specific logic in screen components

### 3. Service Layer Abstraction
Firebase operations abstracted into service layer:
- Clean API for components to use
- Centralized error handling
- Easy testing and mocking

## Future Architecture Enhancements

### 1. State Management Evolution
Consider React Context or Redux for complex state:
- Global app state management
- Cross-component data sharing
- Optimized re-render patterns

### 2. Offline Capability
Enhanced offline support:
- Local data caching
- Sync when connection restored
- Offline-first design patterns

### 3. Performance Monitoring
Add monitoring and analytics:
- Performance metrics collection
- Error tracking and reporting
- User experience analytics

### 4. Testing Infrastructure
Comprehensive testing strategy:
- Unit tests for services
- Integration tests for Firebase operations
- UI testing for critical user flows