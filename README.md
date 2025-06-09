# ILoveYou - Couple Love Tracker 💕

A beautiful Progressive Web App (PWA) for couples to track their love journey, create shared memories, and manage important reminders together.

![ILoveYou App](./web/public/icon.svg)

## 🌟 Features

### Phase 4 - Enhanced Features & PWA (Current)

#### 📸 **Enhanced Note Management**
- **Photo Upload & Gallery**: Attach multiple photos to your love notes with drag-and-drop support
- **Advanced Search**: Powerful search with filters, sorting, and fuzzy matching
- **Data Export**: Export your memories as JSON or CSV backups
- **Offline Support**: Full offline functionality with automatic sync when online

#### 🎯 **Smart Reminders**
- **Push Notifications**: Never miss an anniversary or special moment
- **Recurring Events**: Set up yearly anniversaries and monthly milestones
- **Smart Scheduling**: Intelligent reminder suggestions based on your relationship timeline

#### ⚡ **Progressive Web App**
- **Install Anywhere**: Works on mobile, tablet, and desktop like a native app
- **Offline First**: Full functionality without internet connection
- **Fast Loading**: Optimized performance with lazy loading and caching
- **Push Notifications**: Real-time reminder notifications

#### 🎨 **Enhanced User Experience**
- **Keyboard Shortcuts**: Power user shortcuts for quick navigation (Ctrl+N for new note, Ctrl+K for search, etc.)
- **Milestone Celebrations**: Animated celebrations for relationship milestones
- **Advanced Animations**: Beautiful Lottie animations and smooth transitions
- **Loading Skeletons**: Polished loading states for better perceived performance

#### 📊 **Performance & Quality**
- **90+ Lighthouse Score**: Optimized for performance, accessibility, and SEO
- **Error Boundaries**: Graceful error handling with recovery options
- **Comprehensive Testing**: 80%+ code coverage with unit and integration tests
- **Bundle Optimization**: Code splitting and lazy loading for fast startup

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project setup
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/iloveyou-app.git
   cd iloveyou-app
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Web app dependencies
   cd web
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp web/.env.example web/.env.local
   
   # Edit with your Firebase config
   nano web/.env.local
   ```

4. **Firebase Configuration**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init
   ```

5. **Start Development Server**
   ```bash
   cd web
   npm run dev
   ```

   Visit `http://localhost:3000` to see the app in action! 🎉

## 📱 Platform Support

| Platform | Support Level | Features |
|----------|---------------|----------|
| **Desktop** | ✅ Full | All features, keyboard shortcuts, desktop notifications |
| **Mobile** | ✅ Full | Touch-optimized, PWA install, mobile notifications |
| **Tablet** | ✅ Full | Responsive design, touch gestures |
| **Offline** | ✅ Full | Complete functionality, automatic sync |

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:debug        # Start with debug mode

# Building
npm run build            # Production build
npm run build:analyze    # Build with bundle analysis
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:coverage    # Run tests with coverage
npm run test:ui          # Run tests with UI
npm run test:e2e         # Run end-to-end tests

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run typecheck        # TypeScript type checking

# Performance
npm run lighthouse       # Run Lighthouse audit
npm run analyze          # Analyze bundle size

# Deployment
npm run deploy:firebase  # Deploy to Firebase
npm run deploy:preview   # Deploy to preview channel
./deploy.sh              # Full deployment script
```

### Project Structure

```
web/
├── public/                 # Static assets
│   ├── icons/             # PWA icons
│   ├── manifest.json      # PWA manifest
│   └── icon.svg          # App icon
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── notes/        # Note management
│   │   ├── reminders/    # Reminder components
│   │   ├── search/       # Search functionality
│   │   ├── pwa/          # PWA components
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   │   ├── useAdvancedSearch.js
│   │   ├── usePhotoUpload.js
│   │   ├── useKeyboardShortcuts.js
│   │   ├── useOfflineCache.js
│   │   └── usePWA.js
│   ├── services/         # External services
│   │   ├── firebase.js   # Firebase configuration
│   │   ├── performance.js # Performance monitoring
│   │   └── webNotifications.js
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── theme/            # Material-UI theme
│   ├── i18n/             # Internationalization
│   └── test/             # Test utilities
├── deploy.sh             # Deployment script
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies and scripts
```

## 🧪 Testing

The app includes comprehensive testing:

- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: User flow testing
- **Performance Tests**: Lighthouse audits and Web Vitals
- **Accessibility Tests**: WCAG compliance testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test files
npm run test -- --run src/components/notes

# Run tests in watch mode
npm run test:watch
```

## 📚 Key Technologies

- **Frontend**: React 18, Material-UI 5, Vite
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **PWA**: Workbox, Web App Manifest, Service Workers
- **Testing**: Vitest, React Testing Library, Lighthouse
- **Performance**: Web Vitals, Bundle Analyzer, Lazy Loading
- **Deployment**: Firebase Hosting, GitHub Actions
- **Languages**: JavaScript/TypeScript, HTML5, CSS3

## 🔧 Configuration

### Environment Variables

Create `.env.local` file in the web directory:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# PWA Push Notifications
VITE_VAPID_PUBLIC_KEY=your_vapid_key

# Analytics
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Enable Storage
5. Enable Hosting
6. Configure security rules

### PWA Configuration

The app is configured as a Progressive Web App with:

- **Service Worker**: Automatic caching and offline support
- **Web App Manifest**: Installation prompts and app metadata
- **Push Notifications**: Reminder notifications
- **Background Sync**: Offline data synchronization

## 🚀 Deployment

### Automatic Deployment

Use the provided deployment script:

```bash
# Production deployment
./deploy.sh

# Staging deployment
./deploy.sh --env staging

# Preview deployment
./deploy.sh --preview

# Skip tests (faster deployment)
./deploy.sh --skip-tests
```

### Manual Deployment

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### CI/CD Pipeline

The project includes GitHub Actions workflows for:

- **Continuous Integration**: Automated testing on pull requests
- **Deployment**: Automatic deployment to staging and production
- **Performance Monitoring**: Lighthouse audits on every deployment

## 📊 Performance Metrics

Target performance metrics:

- **Lighthouse Score**: 90+ across all categories
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Bundle Size**: < 500KB gzipped

## ♿ Accessibility

The app follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantics
- **Color Contrast**: Meets AA contrast requirements
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Images have descriptive alt text

## 🌍 Internationalization

Currently supports:
- **English** (en)
- **Vietnamese** (vi)

Adding new languages:
1. Create translation file in `src/i18n/locales/`
2. Add language to `src/i18n/index.js`
3. Update language switcher component

## 🔒 Security

Security measures implemented:

- **Firebase Security Rules**: Proper data access controls
- **Authentication**: Secure user authentication
- **HTTPS**: All communications encrypted
- **Content Security Policy**: XSS protection
- **Input Validation**: Client and server-side validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

### Code Style

- **ESLint**: Enforced code style
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format
- **TypeScript**: Type safety (gradual migration)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI**: Beautiful React components
- **Firebase**: Backend infrastructure
- **Vite**: Fast build tool
- **React**: UI framework
- **Workbox**: PWA capabilities

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/iloveyou-app/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/iloveyou-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/iloveyou-app/discussions)
- **Email**: support@iloveyou-app.com

## 🗺️ Roadmap

### Upcoming Features

- **Video Messages**: Share video notes
- **Voice Notes**: Audio messages support
- **Couple Analytics**: Relationship insights
- **Social Sharing**: Share milestones
- **Calendar Integration**: Sync with external calendars
- **AI Suggestions**: Smart reminder suggestions

---

**Made with 💕 by couples, for couples**

Track your love journey, one memory at a time! ✨