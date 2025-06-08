# ILoveYou 💕

A beautiful React Native app designed to celebrate love and connection between couples.

## Features ✨

### Authentication 🔐
- User registration and login with Firebase Auth
- Email/password authentication
- Secure user session management
- Beautiful love-themed UI

### User Management 👤
- User profile creation and editing
- Profile photo support
- Account management and deletion
- Personalized user experience

### Navigation 🧭
- Intuitive tab-based navigation
- Stack navigation for user flows
- Deep linking support
- Navigation state persistence

### Love-Themed UI 💖
- Beautiful gradient backgrounds
- Love-themed colors and emojis
- Smooth animations and transitions
- Responsive design for all screen sizes

### App Screens 📱
- **Profile Tab**: Manage your personal profile
- **Our Love Tab**: Connect with your partner (User management)
- **Messages Tab**: Chat and love notes (Coming soon!)
- **Settings Tab**: App preferences and account settings

## Tech Stack 🛠️

- **React Native** with Expo
- **Firebase** for authentication and data storage
- **React Navigation** for navigation
- **Expo Vector Icons** for beautiful icons
- **AsyncStorage** for local data persistence

## Getting Started 🚀

### Prerequisites
- Node.js (v14 or later)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app on your device)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ILoveYou
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication with Email/Password provider
   - Enable Firestore Database
   - Download your Firebase config
   - Update `src/services/firebase/config.js` with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## Project Structure 📁

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   │   ├── LoveButton.js
│   │   ├── LoveInput.js
│   │   ├── LoveBackground.js
│   │   ├── LoadingIndicator.js
│   │   └── UserProfileCard.js
│   └── index.js        # Component exports
├── navigation/         # Navigation configuration
│   ├── AppNavigator.js # Main navigation setup
│   └── index.js
├── screens/           # App screens
│   ├── auth/          # Authentication screens
│   │   ├── LoginScreen.js
│   │   ├── SignUpScreen.js
│   │   └── WelcomeScreen.js
│   ├── user/          # User management screens
│   │   ├── UserProfileScreen.js
│   │   ├── UserListScreen.js
│   │   ├── UserEditScreen.js
│   │   └── UserDeleteScreen.js
│   ├── SettingsScreen.js
│   ├── MessagesScreen.js
│   └── index.js
├── services/          # External services
│   ├── firebase/      # Firebase integration
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── firestore.js
│   │   └── index.js
│   └── index.js
└── utils/            # Utility functions
    └── index.js      # Helper functions and constants
```

## Features in Detail 📋

### 🔐 Authentication Flow
- Beautiful welcome screens with love-themed design
- Email/password registration and login
- Form validation with helpful error messages
- Automatic navigation based on authentication state

### 👤 User Management
- Complete user profile management
- Edit profile information
- Account deletion with confirmation
- User list for couple connections

### 💌 Messages (Coming Soon)
- Real-time chat between couples
- Love notes and letter writing
- Photo and media sharing
- Voice messages

### ⚙️ Settings
- App preferences and customization
- Privacy settings
- Help and support information
- About page with app information

## Color Scheme 🎨

The app uses a beautiful love-themed color palette:
- **Primary**: Pink (#FF69B4)
- **Secondary**: Light Pink (#FFB6C1)
- **Accent**: Deep Pink (#FF1493)
- **Dark**: Dark Red (#8B0000)
- **Light**: Pale Pink (#FFE4E6)
- **Background**: Lavender Blush (#FFF0F5)

## Development 💻

### Running Tests
```bash
npm test
```

### Building for Production
```bash
expo build:ios
expo build:android
```

### Code Style
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Maintain consistent naming conventions

## Troubleshooting 🔧

### Common Issues

1. **Firebase connection issues**
   - Verify your Firebase configuration
   - Check network connectivity
   - Ensure Firebase project is active

2. **Navigation not working**
   - Clear AsyncStorage: `AsyncStorage.clear()`
   - Restart the development server

3. **Expo/Metro bundler issues**
   - Clear cache: `expo start -c`
   - Reset Metro cache: `npx react-native start --reset-cache`

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

For support and questions:
- Create an issue on GitHub
- Contact: support@iloveyou.app

## Roadmap 🗺️

### Upcoming Features
- [ ] Real-time messaging
- [ ] Photo sharing
- [ ] Voice messages
- [ ] Couple matching
- [ ] Love notes and letters
- [ ] Anniversary reminders
- [ ] Date planning tools
- [ ] Memory timeline
- [ ] Dark mode support
- [ ] Push notifications

---

Made with 💝 for couples in love.

*Version 1.0.0*