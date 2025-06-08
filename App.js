import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation';
import { LoveBackground, LoadingIndicator } from './src/components';
import { AuthProvider } from './src/context/AuthContext';
import './src/i18n'; // Initialize i18n

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <LoveBackground>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 24, color: '#8B0000', textAlign: 'center', marginBottom: 16 }}>
              Oops! Something went wrong 💔
            </Text>
            <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>
              Don't worry, love always finds a way. Please restart the app to continue your journey.
            </Text>
            <Text style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
              Made with 💝 for couples in love
            </Text>
          </View>
        </LoveBackground>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App initialized successfully');
        // Remove the delay - app starts immediately
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        setAppIsReady(true);
        // Hide splash screen immediately
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <LoveBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingIndicator 
            message="Starting ILoveYou..." 
            size="large" 
          />
        </View>
      </LoveBackground>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <AppNavigator />
          <StatusBar style="auto" />
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}