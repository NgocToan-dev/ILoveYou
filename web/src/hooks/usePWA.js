import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';

export const usePWA = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Register service worker
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Check if app is already installed
  useEffect(() => {
    const checkIfInstalled = () => {
      // Check if running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator).standalone === true;
      
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();
    
    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkIfInstalled);
    
    return () => mediaQuery.removeEventListener('change', checkIfInstalled);
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Show install prompt after a delay if not installed
      if (!isInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 5000); // Show after 5 seconds
      }
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to the install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallPrompt(false);
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error during installation:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    // Store in localStorage to not show again for some time
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  }, []);

  // Check if install prompt should be shown
  const shouldShowInstallPrompt = useCallback(() => {
    if (isInstalled || !isInstallable || !showInstallPrompt) return false;
    
    // Don't show if recently dismissed
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const daysSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return false; // Don't show for 7 days
    }
    
    return true;
  }, [isInstalled, isInstallable, showInstallPrompt]);

  // Update app
  const updateApp = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  // Close update prompt
  const closeUpdatePrompt = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  // Close offline ready prompt
  const closeOfflinePrompt = useCallback(() => {
    setOfflineReady(false);
  }, [setOfflineReady]);

  // Get platform-specific install instructions
  const getInstallInstructions = useCallback(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      return {
        platform: 'ios',
        title: t('pwa.install.ios.title'),
        steps: [
          t('pwa.install.ios.step1'),
          t('pwa.install.ios.step2'),
          t('pwa.install.ios.step3')
        ]
      };
    } else if (isAndroid) {
      return {
        platform: 'android',
        title: t('pwa.install.android.title'),
        steps: [
          t('pwa.install.android.step1'),
          t('pwa.install.android.step2')
        ]
      };
    } else {
      return {
        platform: 'desktop',
        title: t('pwa.install.desktop.title'),
        steps: [
          t('pwa.install.desktop.step1'),
          t('pwa.install.desktop.step2')
        ]
      };
    }
  }, [t]);

  // Get PWA capabilities info
  const getPWACapabilities = useCallback(() => {
    return {
      canInstall: isInstallable && !isInstalled,
      isInstalled,
      isOfflineReady: offlineReady,
      needsUpdate: needRefresh,
      supportsNotifications: 'Notification' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsPush: 'PushManager' in window,
      isOnline: navigator.onLine
    };
  }, [isInstallable, isInstalled, offlineReady, needRefresh]);

  return {
    // Installation
    isInstallable,
    isInstalled,
    installApp,
    showInstallPrompt: shouldShowInstallPrompt(),
    dismissInstallPrompt,
    getInstallInstructions,
    
    // Service Worker
    offlineReady,
    needRefresh,
    updateApp,
    closeUpdatePrompt,
    closeOfflinePrompt,
    
    // Capabilities
    getPWACapabilities
  };
};

// Hook for handling PWA notifications
export const usePWANotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push messaging is not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      });

      setSubscription(sub);
      return sub;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  }, [subscription]);

  // Show local notification
  const showNotification = useCallback(async (title, options = {}) => {
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      return registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    } else {
      return new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options
      });
    }
  }, [permission]);

  useEffect(() => {
    // Check existing subscription on mount
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  return {
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification,
    isSupported: 'Notification' in window
  };
};