import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { muiLoveTheme } from './theme/loveTheme';
import { AuthContextProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PWAInstallPrompt, { PWAUpdatePrompt, PWAOfflinePrompt } from './components/pwa/PWAInstallPrompt';
import { useGlobalKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import performanceService from './services/performance';
import webNotificationsService from './services/webNotifications';
import { initializeNotificationService } from '@shared/services/firebase/reminders';
import './App.css';

function App() {
  // Initialize global keyboard shortcuts
  useGlobalKeyboardShortcuts();
  // Initialize performance monitoring
  useEffect(() => {
    // Initialize notification service for shared reminders
    initializeNotificationService(webNotificationsService);
    console.log('✅ Web notification service initialized for reminders');

    // Check for overdue reminders on app startup
    webNotificationsService.checkOverdueReminders().catch(error => {
      console.warn('Error checking overdue reminders:', error);
    });

    // Performance monitoring is automatically initialized in the service
    // Mark app initialization
    const measure = performanceService.startMeasure('app_initialization');
    
    // Mark feature usage
    performanceService.markFeatureUsage('app_start', {
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      connection: navigator.connection?.effectiveType || 'unknown'
    });

    // End measurement after a frame
    requestAnimationFrame(() => {
      measure.end();
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={muiLoveTheme}>
        <CssBaseline />        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <AuthContextProvider>
              <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
                <AppRoutes />
                
                {/* PWA Components */}
                <PWAInstallPrompt />
                <PWAUpdatePrompt />
                <PWAOfflinePrompt />
              </Box>
            </AuthContextProvider>
          </BrowserRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;