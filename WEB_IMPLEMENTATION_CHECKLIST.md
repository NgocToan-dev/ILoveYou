# 🚀 ILoveYou Web Implementation - Detailed Checklist

## 📋 Overview

This checklist provides a step-by-step implementation guide for creating the web version of the ILoveYou couples app. Each task includes specific files to create, dependencies to install, and code examples.

---

## 🏗️ Phase 1: Foundation Setup (Week 1-2)

### ✅ 1.1 Project Restructure

#### Task 1.1.1: Reorganize Current Project Structure
- [ ] **Create new directory structure**
  ```bash
  mkdir mobile web shared
  ```

- [ ] **Move existing React Native files to mobile directory**
  ```bash
  # Move all current files except .git to mobile/
  mv src/ mobile/
  mv App.js mobile/
  mv package.json mobile/
  mv babel.config.js mobile/
  mv metro.config.js mobile/
  # ... move all other files except .git, .gitignore, README.md
  ```

- [ ] **Create root package.json for workspace management**
  ```json
  {
    "name": "iloveyou-workspace",
    "version": "1.0.0",
    "private": true,
    "workspaces": ["mobile", "web", "shared"],
    "scripts": {
      "dev:mobile": "cd mobile && npm start",
      "dev:web": "cd web && npm run dev",
      "build:mobile": "cd mobile && expo build",
      "build:web": "cd web && npm run build",
      "test:all": "npm run test:shared && npm run test:mobile && npm run test:web",
      "lint:all": "eslint mobile/ web/ shared/",
      "install:all": "npm install && cd mobile && npm install && cd ../web && npm install"
    },
    "devDependencies": {
      "eslint": "^8.0.0",
      "prettier": "^3.0.0"
    }
  }
  ```

#### Task 1.1.2: Create Shared Directory Structure
- [ ] **Create shared package.json**
  ```json
  {
    "name": "@iloveyou/shared",
    "version": "1.0.0",
    "private": true,
    "main": "index.js",
    "dependencies": {
      "firebase": "^11.9.0",
      "date-fns": "^2.30.0"
    }
  }
  ```

- [ ] **Create shared directory structure**
  ```bash
  mkdir -p shared/{services,models,constants,utils,i18n,types}
  mkdir -p shared/services/{firebase,notifications}
  mkdir -p shared/i18n/locales
  ```

### ✅ 1.2 Shared Services Migration

#### Task 1.2.1: Move Firebase Services
- [ ] **Move Firebase configuration**
  ```bash
  # Copy from mobile/src/services/firebase/ to shared/services/firebase/
  cp mobile/src/services/firebase/config.js shared/services/firebase/
  cp mobile/src/services/firebase/auth.js shared/services/firebase/
  cp mobile/src/services/firebase/firestore.js shared/services/firebase/
  cp mobile/src/services/firebase/couples.js shared/services/firebase/
  cp mobile/src/services/firebase/notes.js shared/services/firebase/
  cp mobile/src/services/firebase/reminders.js shared/services/firebase/
  cp mobile/src/services/firebase/loveDays.js shared/services/firebase/
  cp mobile/src/services/firebase/index.js shared/services/firebase/
  ```

- [ ] **Update Firebase config for cross-platform compatibility**
  ```javascript
  // shared/services/firebase/config.js
  import { initializeApp } from 'firebase/app';
  import { getAuth } from 'firebase/auth';
  import { getFirestore } from 'firebase/firestore';

  const firebaseConfig = {
    // ... existing config
  };

  const app = initializeApp(firebaseConfig);

  export const auth = getAuth(app);
  export const db = getFirestore(app);

  // Platform detection
  export const isWebPlatform = typeof window !== 'undefined';
  export const isMobilePlatform = !isWebPlatform;

  // Web-specific optimizations
  if (isWebPlatform) {
    console.log('Firebase initialized for web platform');
  }

  export default app;
  ```

#### Task 1.2.2: Move Models and Constants
- [ ] **Move data models**
  ```bash
  cp mobile/src/models/* shared/models/
  cp mobile/src/constants/* shared/constants/
  ```

- [ ] **Move utilities**
  ```bash
  cp mobile/src/utils/* shared/utils/
  ```

- [ ] **Create shared color constants**
  ```javascript
  // shared/constants/colors.js
  export const loveTheme = {
    primary: {
      main: '#E91E63',
      light: '#F8BBD9',
      dark: '#AD1457',
    },
    secondary: {
      main: '#FFB6C1',
      light: '#FFF0F5',
      dark: '#C2185B',
    },
    error: {
      main: '#F44336',
    },
    background: {
      default: '#FFF0F5',
      paper: '#FFFFFF',
    },
    gradients: {
      primary: ['#E91E63', '#AD1457'],
      secondary: ['#FFB6C1', '#F8BBD9'],
    }
  };

  export default loveTheme;
  ```

#### Task 1.2.3: Move Internationalization
- [ ] **Move i18n files**
  ```bash
  cp mobile/src/i18n/locales/* shared/i18n/locales/
  ```

- [ ] **Create shared i18n configuration**
  ```javascript
  // shared/i18n/index.js
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
  ```

#### Task 1.2.4: Update Mobile App Import Paths
- [ ] **Update mobile app imports to use shared services**
  ```javascript
  // mobile/src/screens/HomeScreen.js
  // Change from:
  // import { authService } from '../services/firebase/auth';
  // To:
  import { authService } from '../../../shared/services/firebase/auth';
  ```

- [ ] **Create mobile alias configuration**
  ```javascript
  // mobile/babel.config.js
  module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        ['module-resolver', {
          alias: {
            '@shared': '../shared'
          }
        }]
      ]
    };
  };
  ```

### ✅ 1.3 Web App Foundation

#### Task 1.3.1: Initialize Vite + React Project
- [ ] **Create web application**
  ```bash
  cd web
  npm create vite@latest . -- --template react
  npm install
  ```

- [ ] **Install required dependencies**
  ```bash
  npm install @mui/material @emotion/react @emotion/styled
  npm install @mui/icons-material @mui/x-date-pickers
  npm install react-router-dom react-i18next i18next
  npm install firebase@11.9.0 date-fns
  npm install @fontsource/roboto
  ```

- [ ] **Install development dependencies**
  ```bash
  npm install -D @vitejs/plugin-react eslint prettier
  npm install -D @testing-library/react @testing-library/jest-dom vitest jsdom
  ```

#### Task 1.3.2: Configure Vite
- [ ] **Create/update vite.config.js**
  ```javascript
  // web/vite.config.js
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    define: {
      global: 'globalThis',
    },
    server: {
      port: 3000,
    },
  });
  ```

#### Task 1.3.3: Create Web Directory Structure
- [ ] **Create web source structure**
  ```bash
  mkdir -p src/{components,pages,layouts,hooks,contexts,theme,utils}
  mkdir -p src/components/{ui,forms,navigation}
  mkdir -p src/pages/{auth,notes,reminders,profile}
  mkdir -p src/layouts
  mkdir -p public/icons
  ```

- [ ] **Create index.html**
  ```html
  <!-- web/index.html -->
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/heart.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#E91E63" />
      <title>ILoveYou - Couples App</title>
      <meta name="description" content="A beautiful couples app to strengthen your relationship" />
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.jsx"></script>
    </body>
  </html>
  ```

#### Task 1.3.4: Create Basic App Structure
- [ ] **Create main.jsx**
  ```jsx
  // web/src/main.jsx
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import App from './App.jsx';
  import './index.css';

  // Import Roboto font
  import '@fontsource/roboto/300.css';
  import '@fontsource/roboto/400.css';
  import '@fontsource/roboto/500.css';
  import '@fontsource/roboto/700.css';

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  ```

- [ ] **Create App.jsx**
  ```jsx
  // web/src/App.jsx
  import React from 'react';
  import { BrowserRouter } from 'react-router-dom';
  import { ThemeProvider } from '@mui/material/styles';
  import CssBaseline from '@mui/material/CssBaseline';
  import { muiLoveTheme } from './theme/loveTheme';
  import AppRoutes from './routes/AppRoutes';
  import './App.css';

  function App() {
    return (
      <ThemeProvider theme={muiLoveTheme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    );
  }

  export default App;
  ```

### ✅ 1.4 MUI Theme Configuration

#### Task 1.4.1: Create Love Theme
- [ ] **Create MUI theme file**
  ```jsx
  // web/src/theme/loveTheme.js
  import { createTheme } from '@mui/material/styles';
  import { loveTheme } from '@shared/constants/colors';

  export const muiLoveTheme = createTheme({
    palette: {
      ...loveTheme,
      mode: 'light',
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 16,
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 48,
            '&.MuiButton-containedPrimary': {
              background: `linear-gradient(135deg, ${loveTheme.primary.main}, ${loveTheme.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${loveTheme.primary.dark}, ${loveTheme.primary.main})`,
              },
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(233, 30, 99, 0.1)',
          },
        },
      },
    },
  });
  ```

### ✅ 1.5 Firebase Integration

#### Task 1.5.1: Set up Firebase for Web
- [ ] **Create web Firebase service adapter**
  ```javascript
  // web/src/services/firebase.js
  import { auth, db } from '@shared/services/firebase/config';
  import { authService } from '@shared/services/firebase/auth';
  import { notesService } from '@shared/services/firebase/notes';
  import { remindersService } from '@shared/services/firebase/reminders';
  import { couplesService } from '@shared/services/firebase/couples';
  import { loveDaysService } from '@shared/services/firebase/loveDays';

  // Re-export for easy importing in web components
  export {
    auth,
    db,
    authService,
    notesService,
    remindersService,
    couplesService,
    loveDaysService,
  };
  ```

---

## 🔐 Phase 2: Authentication & Core Layout (Week 3-4)

### ✅ 2.1 Authentication System

#### Task 2.1.1: Create Auth Context
- [ ] **Create AuthContext**
  ```jsx
  // web/src/contexts/AuthContext.jsx
  import React, { createContext, useContext, useEffect, useState } from 'react';
  import { authService } from '@shared/services/firebase/auth';

  const AuthContext = createContext({});

  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };

  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = authService.onAuthStateChanged((user) => {
        setUser(user);
        setLoading(false);
      });

      return unsubscribe;
    }, []);

    const login = async (email, password) => {
      setLoading(true);
      try {
        const result = await authService.login(email, password);
        return result;
      } finally {
        setLoading(false);
      }
    };

    const signup = async (email, password, displayName) => {
      setLoading(true);
      try {
        const result = await authService.signup(email, password, displayName);
        return result;
      } finally {
        setLoading(false);
      }
    };

    const logout = async () => {
      setLoading(true);
      try {
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    const value = {
      user,
      loading,
      login,
      signup,
      logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
  ```

#### Task 2.1.2: Create Login Page
- [ ] **Create LoginPage component**
  ```jsx
  // web/src/pages/auth/LoginPage.jsx
  import React, { useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
  } from '@mui/material';
  import { useAuth } from '../../contexts/AuthContext';
  import LoveBackground from '../../components/ui/LoveBackground';

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!email || !password) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      try {
        setError('');
        setLoading(true);
        await login(email, password);
        navigate('/');
      } catch (error) {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <LoveBackground>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          px={2}
        >
          <Card sx={{ maxWidth: 400, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
                Yêu lắm đấy! 💕
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center" 
                mb={3}
              >
                Đăng nhập để tiếp tục câu chuyện tình yêu của chúng ta
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Đăng nhập với tình yêu 💖'
                  )}
                </Button>
                <Box textAlign="center">
                  <Link to="/signup">
                    <Typography variant="body2" color="primary">
                      Chưa có tài khoản? Tạo tài khoản mới
                    </Typography>
                  </Link>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </LoveBackground>
    );
  };

  export default LoginPage;
  ```

#### Task 2.1.3: Create SignUp Page
- [ ] **Create SignUpPage component**
  ```jsx
  // web/src/pages/auth/SignUpPage.jsx
  import React, { useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
  } from '@mui/material';
  import { useAuth } from '../../contexts/AuthContext';
  import LoveBackground from '../../components/ui/LoveBackground';

  const SignUpPage = () => {
    const [formData, setFormData] = useState({
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu không khớp');
        return;
      }

      if (formData.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }

      try {
        setError('');
        setLoading(true);
        await signup(formData.email, formData.password, formData.displayName);
        navigate('/');
      } catch (error) {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <LoveBackground>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          px={2}
        >
          <Card sx={{ maxWidth: 400, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
                Tham gia vào tình yêu! 💕
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Tên đáng yêu của em"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Địa chỉ email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Tạo tài khoản với tình yêu 💖'
                  )}
                </Button>
                <Box textAlign="center">
                  <Link to="/login">
                    <Typography variant="body2" color="primary">
                      Đã có tài khoản? Đăng nhập
                    </Typography>
                  </Link>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </LoveBackground>
    );
  };

  export default SignUpPage;
  ```

### ✅ 2.2 Responsive Layout System

#### Task 2.2.1: Create LoveBackground Component
- [ ] **Create LoveBackground component**
  ```jsx
  // web/src/components/ui/LoveBackground.jsx
  import React from 'react';
  import { Box } from '@mui/material';
  import { styled } from '@mui/material/styles';

  const StyledBackground = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.background.default}, ${theme.palette.secondary.light})`,
    minHeight: '100vh',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFB6C1" fill-opacity="0.1"%3E%3Cpath d="M30 30c0-11.046-8.954-20-20-20S-10 18.954-10 30s8.954 20 20 20 20-8.954 20-20z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
  }));

  const LoveBackground = ({ children, ...props }) => {
    return (
      <StyledBackground {...props}>
        <Box position="relative" zIndex={1} minHeight="100vh">
          {children}
        </Box>
      </StyledBackground>
    );
  };

  export default LoveBackground;
  ```

#### Task 2.2.2: Create Responsive Layouts
- [ ] **Create DesktopLayout**
  ```jsx
  // web/src/layouts/DesktopLayout.jsx
  import React from 'react';
  import { Box, Drawer, useTheme } from '@mui/material';
  import { Outlet } from 'react-router-dom';
  import Sidebar from '../components/navigation/Sidebar';

  const DRAWER_WIDTH = 280;

  const DesktopLayout = () => {
    const theme = useTheme();

    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              background: `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
              borderRight: 'none',
            },
          }}
        >
          <Sidebar />
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    );
  };

  export default DesktopLayout;
  ```

- [ ] **Create MobileLayout**
  ```jsx
  // web/src/layouts/MobileLayout.jsx
  import React from 'react';
  import { Box, BottomNavigation, BottomNavigationAction, useTheme } from '@mui/material';
  import { Outlet, useNavigate, useLocation } from 'react-router-dom';
  import {
    Home as HomeIcon,
    Favorite as FavoriteIcon,
    Note as NoteIcon,
    Alarm as AlarmIcon,
    Person as PersonIcon,
  } from '@mui/icons-material';

  const MobileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const navItems = [
      { label: 'Trang chủ', value: '/', icon: <HomeIcon /> },
      { label: 'Kết nối', value: '/couple', icon: <FavoriteIcon /> },
      { label: 'Ghi chú', value: '/notes', icon: <NoteIcon /> },
      { label: 'Nhắc nhở', value: '/reminders', icon: <AlarmIcon /> },
      { label: 'Cá nhân', value: '/profile', icon: <PersonIcon /> },
    ];

    const currentValue = navItems.find(item => 
      location.pathname === item.value || 
      (item.value !== '/' && location.pathname.startsWith(item.value))
    )?.value || '/';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            pb: 8,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Outlet />
        </Box>
        <BottomNavigation
          value={currentValue}
          onChange={(event, newValue) => navigate(newValue)}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: `1px solid ${theme.palette.divider}`,
            '& .MuiBottomNavigationAction-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Box>
    );
  };

  export default MobileLayout;
  ```

#### Task 2.2.3: Create Responsive Layout Hook
- [ ] **Create useResponsiveLayout hook**
  ```jsx
  // web/src/hooks/useResponsiveLayout.js
  import { useTheme, useMediaQuery } from '@mui/material';

  export const useResponsiveLayout = () => {
    const theme = useTheme();
    
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    return {
      isMobile,
      isTablet,
      isDesktop,
      currentBreakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    };
  };
  ```

### ✅ 2.3 Navigation Components

#### Task 2.3.1: Create Sidebar Component
- [ ] **Create Sidebar component**
  ```jsx
  // web/src/components/navigation/Sidebar.jsx
  import React from 'react';
  import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Avatar,
    Divider,
  } from '@mui/material';
  import { useNavigate, useLocation } from 'react-router-dom';
  import {
    Home as HomeIcon,
    Favorite as FavoriteIcon,
    Note as NoteIcon,
    Alarm as AlarmIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
  } from '@mui/icons-material';
  import { useAuth } from '../../contexts/AuthContext';

  const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const navItems = [
      { label: 'Trang chủ', path: '/', icon: <HomeIcon /> },
      { label: 'Kết nối', path: '/couple', icon: <FavoriteIcon /> },
      { label: 'Ghi chú', path: '/notes', icon: <NoteIcon /> },
      { label: 'Nhắc nhở', path: '/reminders', icon: <AlarmIcon /> },
      { label: 'Cá nhân', path: '/profile', icon: <PersonIcon /> },
      { label: 'Cài đặt', path: '/settings', icon: <SettingsIcon /> },
    ];

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            ILoveYou 💕
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 40, height: 40 }}>
                {user.displayName?.[0] || user.email?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {user.displayName || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Navigation */}
        <List sx={{ flexGrow: 1, px: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    color: isActive ? 'primary.main' : 'rgba(255,255,255,0.8)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Footer */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Made with 💝 for couples in love
          </Typography>
        </Box>
      </Box>
    );
  };

  export default Sidebar;
  ```

### ✅ 2.4 Routing Setup

#### Task 2.4.1: Create App Routes
- [ ] **Create AppRoutes component**
  ```jsx
  // web/src/routes/AppRoutes.jsx
  import React from 'react';
  import { Routes, Route, Navigate } from 'react-router-dom';
  import { AuthProvider } from '../contexts/AuthContext';
  import ProtectedRoute from './ProtectedRoute';
  import ResponsiveLayout from '../layouts/ResponsiveLayout';
  import LoginPage from '../pages/auth/LoginPage';
  import SignUpPage from '../pages/auth/SignUpPage';
  import HomePage from '../pages/HomePage';
  import NotesPage from '../pages/notes/NotesPage';
  import RemindersPage from '../pages/reminders/RemindersPage';
  import ProfilePage from '../pages/profile/ProfilePage';
  import SettingsPage from '../pages/SettingsPage';
  import CoupleConnectionPage from '../pages/CoupleConnectionPage';

  const AppRoutes = () => {
    return (
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <ResponsiveLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="couple" element={<CoupleConnectionPage />} />
            <Route path="notes/*" element={<NotesPage />} />
            <Route path="reminders/*" element={<RemindersPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    );
  };

  export default AppRoutes;
  ```

- [ ] **Create ProtectedRoute component**
  ```jsx
  // web/src/routes/ProtectedRoute.jsx
  import React from 'react';
  import { Navigate } from 'react-router-dom';
  import { Box, CircularProgress } from '@mui/material';
  import { useAuth } from '../contexts/AuthContext';
  import LoveBackground from '../components/ui/LoveBackground';

  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <LoveBackground>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
          >
            <CircularProgress size={60} />
          </Box>
        </LoveBackground>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  export default ProtectedRoute;
  ```

- [ ] **Create ResponsiveLayout component**
  ```jsx
  // web/src/layouts/ResponsiveLayout.jsx
  import React from 'react';
  import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
  import DesktopLayout from './DesktopLayout';
  import MobileLayout from './MobileLayout';

  const ResponsiveLayout = () => {
    const { isMobile } = useResponsiveLayout();

    return isMobile ? <MobileLayout /> : <DesktopLayout />;
  };

  export default ResponsiveLayout;
  ```

---

## 📝 Phase 3: Core Features Implementation (Week 5-8)

### ✅ 3.1 Home & Love Days Counter

#### Task 3.1.1: Create HomePage
- [ ] **Create HomePage component**
  ```jsx
  // web/src/pages/HomePage.jsx
  import React from 'react';
  import { Box, Container, Grid, Typography } from '@mui/material';
  import LoveDaysCounter from '../components/ui/LoveDaysCounter';
  import QuickActions from '../components/ui/QuickActions';
  import RecentActivity from '../components/ui/RecentActivity';

  const HomePage = () => {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Xin chào! 💕
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <LoveDaysCounter />
          </Grid>
          <Grid item xs={12} md={4}>
            <QuickActions />
          </Grid>
          <Grid item xs={12}>
            <RecentActivity />
          </Grid>
        </Grid>
      </Container>
    );
  };

  export default HomePage;
  ```

#### Task 3.1.2: Create LoveDaysCounter Component
- [ ] **Create LoveDaysCounter**
  ```jsx
  // web/src/components/ui/LoveDaysCounter.jsx
  import React, { useState, useEffect } from 'react';
  import {
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Button,
  } from '@mui/material';
  import { styled } from '@mui/material/styles';
  import { Favorite as HeartIcon } from '@mui/icons-material';
  import { loveDaysService } from '@shared/services/firebase/loveDays';
  import { useAuth } from '../../contexts/AuthContext';

  const StyledCard = styled(Card)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    color: 'white',
    position: 'relative',
    overflow: 'visible',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -10,
      right: -10,
      width: 60,
      height: 60,
      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));

  const LoveDaysCounter = () => {
    const [peacefulDays, setPeacefulDays] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
      const fetchPeacefulDays = async () => {
        try {
          // Get user's couple ID first, then fetch peaceful days
          // This is a simplified version - you'll need to implement
          // the actual couple connection logic
          const data = await loveDaysService.getPeacefulDays('couple-id');
          setPeacefulDays(data);
        } catch (error) {
          console.error('Error fetching peaceful days:', error);
        } finally {
          setLoading(false);
        }
      };

      if (user) {
        fetchPeacefulDays();
      }
    }, [user]);

    if (loading) {
      return (
        <Card sx={{ minHeight: 200 }}>
          <CardContent>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      );
    }

    const currentStreak = peacefulDays?.currentStreak || 0;
    const longestStreak = peacefulDays?.longestStreak || 0;

    return (
      <StyledCard>
        <CardContent sx={{ p: 4, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <HeartIcon sx={{ fontSize: 32, opacity: 0.8 }} />
          </Box>
          
          <Typography variant="h6" gutterBottom sx={{ opacity: 0.9 }}>
            Những ngày bình yên
          </Typography>
          
          <Box sx={{ my: 3 }}>
            <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              {currentStreak}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.8 }}>
              ngày liên tiếp 🌟
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Kỷ lục của chúng ta
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {longestStreak} ngày
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            Xem lịch sử 📊
          </Button>
        </CardContent>
      </StyledCard>
    );
  };

  export default LoveDaysCounter;
  ```

### ✅ 3.2 Notes System

#### Task 3.2.1: Create NotesPage
- [ ] **Create NotesPage component**
  ```jsx
  // web/src/pages/notes/NotesPage.jsx
  import React, { useState, useEffect } from 'react';
  import { Routes, Route } from 'react-router-dom';
  import NotesListPage from './NotesListPage';
  import CreateNotePage from './CreateNotePage';
  import NoteDetailPage from './NoteDetailPage';
  import EditNotePage from './EditNotePage';

  const NotesPage = () => {
    return (
      <Routes>
        <Route index element={<NotesListPage />} />
        <Route path="create" element={<CreateNotePage />} />
        <Route path=":id" element={<NoteDetailPage />} />
        <Route path=":id/edit" element={<EditNotePage />} />
      </Routes>
    );
  };

  export default NotesPage;
  ```

#### Task 3.2.2: Create NotesListPage
- [ ] **Create NotesListPage**
  ```jsx
  // web/src/pages/notes/NotesListPage.jsx
  import React, { useState, useEffect } from 'react';
  import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Fab,
    Chip,
    TextField,
    InputAdornment,
    CircularProgress,
  } from '@mui/material';
  import {
    Add as AddIcon,
    Search as SearchIcon,
    Favorite as HeartIcon,
  } from '@mui/icons-material';
  import { useNavigate } from 'react-router-dom';
  import { notesService } from '@shared/services/firebase/notes';
  import { useAuth } from '../../contexts/AuthContext';

  const NotesListPage = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    const navigate = useNavigate();
    const { user } = useAuth();

    const categories = [
      { value: 'all', label: 'Tất cả', color: 'default' },
      { value: 'loveLetters', label: 'Thư tình', color: 'error' },
      { value: 'memories', label: 'Kỷ niệm', color: 'primary' },
      { value: 'dreams', label: 'Ước mơ', color: 'secondary' },
      { value: 'gratitude', label: 'Lòng biết ơn', color: 'success' },
    ];

    useEffect(() => {
      const fetchNotes = async () => {
        try {
          const userNotes = await notesService.getUserNotes(user.uid);
          setNotes(userNotes);
        } catch (error) {
          console.error('Error fetching notes:', error);
        } finally {
          setLoading(false);
        }
      };

      if (user) {
        fetchNotes();
      }
    }, [user]);

    const filteredNotes = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (loading) {
      return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      );
    }

    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Ghi chú tình yêu 💕
          </Typography>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <Chip
                key={category.value}
                label={category.label}
                color={selectedCategory === category.value ? category.color : 'default'}
                variant={selectedCategory === category.value ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory(category.value)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Notes Grid */}
        <Grid container spacing={3}>
          {filteredNotes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {note.category === 'loveLetters' && <HeartIcon color="error" />}
                    <Chip 
                      size="small" 
                      label={categories.find(c => c.value === note.category)?.label || note.category}
                      color={categories.find(c => c.value === note.category)?.color || 'default'}
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom noWrap>
                    {note.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {note.content}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(note.createdAt?.toDate()).toLocaleDateString('vi-VN')}
                  </Typography>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredNotes.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || selectedCategory !== 'all' 
                ? 'Không tìm thấy ghi chú nào'
                : 'Chưa có ghi chú nào'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Hãy tạo ghi chú đầu tiên để lưu giữ những kỷ niệm đẹp
            </Typography>
          </Box>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add note"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={() => navigate('/notes/create')}
        >
          <AddIcon />
        </Fab>
      </Container>
    );
  };

  export default NotesListPage;
  ```

---

## 📝 Continuation Checklist

This checklist continues with detailed implementations for:

### ✅ Remaining Phase 3 Tasks
- [ ] **3.2.3** - Create CreateNotePage component
- [ ] **3.2.4** - Create NoteDetailPage component  
- [ ] **3.2.5** - Create EditNotePage component
- [ ] **3.3.1** - Create RemindersPage routing
- [ ] **3.3.2** - Create RemindersListPage component
- [ ] **3.3.3** - Create CreateReminderPage component
- [ ] **3.3.4** - Implement web notifications service
- [ ] **3.4.1** - Create ProfilePage component
- [ ] **3.4.2** - Create SettingsPage component
- [ ] **3.4.3** - Create CoupleConnectionPage component

### ✅ Phase 4: Enhanced Features & Polish
- [ ] **4.1** - Responsive design optimizations
- [ ] **4.2** - Performance optimizations
- [ ] **4.3** - PWA capabilities
- [ ] **4.4** - Testing and deployment setup

---

## 📚 Implementation Notes

### Key Dependencies for Each Phase
```json
{
  "Phase 1": ["@mui/material", "react-router-dom", "firebase"],
  "Phase 2": ["@mui/icons-material", "react-i18next"],
  "Phase 3": ["@mui/x-date-pickers", "date-fns"],
  "Phase 4": ["workbox", "@testing-library/react", "vitest"]
}
```

### Important Configuration Files
- **Vite Config**: Aliases for shared imports
- **Package.json**: Workspace configuration
- **Theme Config**: MUI customization for love theme
- **Firebase Config**: Cross-platform compatibility

### Testing Strategy
- **Unit Tests**: Components and utilities
- **Integration Tests**: Firebase service integration
- **E2E Tests**: User workflows (optional)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-06  
**Implementation Status**: Ready for Phase 1 execution

This detailed checklist provides specific, actionable tasks for implementing the web version of ILoveYou. Each task includes code examples and file locations to ensure efficient implementation.