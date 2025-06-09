import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

const CACHE_KEYS = {
  NOTES: 'iloveyou_notes',
  REMINDERS: 'iloveyou_reminders',
  COUPLE_DATA: 'iloveyou_couple',
  USER_PREFERENCES: 'iloveyou_preferences',
  LAST_SYNC: 'iloveyou_last_sync'
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useOfflineCache = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const { user } = useAuthContext();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get cache key for user-specific data
  const getUserCacheKey = useCallback((baseKey) => {
    return user ? `${baseKey}_${user.uid}` : baseKey;
  }, [user]);

  // Check if cached data is still valid
  const isCacheValid = useCallback((timestamp) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_EXPIRY;
  }, []);

  // Save data to cache
  const saveToCache = useCallback((key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(getUserCacheKey(key), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, [getUserCacheKey]);

  // Load data from cache
  const loadFromCache = useCallback((key) => {
    try {
      const cached = localStorage.getItem(getUserCacheKey(key));
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (!isCacheValid(cacheData.timestamp)) {
        localStorage.removeItem(getUserCacheKey(key));
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  }, [getUserCacheKey, isCacheValid]);

  // Clear specific cache
  const clearCache = useCallback((key) => {
    try {
      localStorage.removeItem(getUserCacheKey(key));
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [getUserCacheKey]);

  // Clear all app cache
  const clearAllCache = useCallback(() => {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(getUserCacheKey(key));
      });
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }, [getUserCacheKey]);

  // Add pending sync item
  const addPendingSync = useCallback((action) => {
    const syncItem = {
      id: Date.now(),
      action,
      timestamp: Date.now()
    };
    
    setPendingSync(prev => [...prev, syncItem]);
    
    // Save pending sync to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem(getUserCacheKey('pending_sync')) || '[]');
      existing.push(syncItem);
      localStorage.setItem(getUserCacheKey('pending_sync'), JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving pending sync:', error);
    }
  }, [getUserCacheKey]);

  // Load pending sync items
  const loadPendingSync = useCallback(() => {
    try {
      const pending = JSON.parse(localStorage.getItem(getUserCacheKey('pending_sync')) || '[]');
      setPendingSync(pending);
      return pending;
    } catch (error) {
      console.error('Error loading pending sync:', error);
      return [];
    }
  }, [getUserCacheKey]);

  // Clear pending sync items
  const clearPendingSync = useCallback(() => {
    setPendingSync([]);
    localStorage.removeItem(getUserCacheKey('pending_sync'));
  }, [getUserCacheKey]);

  // Sync pending changes when online
  const syncPendingChanges = useCallback(async (syncFunction) => {
    if (!isOnline || pendingSync.length === 0) return;

    try {
      for (const syncItem of pendingSync) {
        await syncFunction(syncItem.action);
      }
      clearPendingSync();
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  }, [isOnline, pendingSync, clearPendingSync]);

  // Cache notes
  const cacheNotes = useCallback((notes) => {
    saveToCache(CACHE_KEYS.NOTES, notes);
  }, [saveToCache]);

  const getCachedNotes = useCallback(() => {
    return loadFromCache(CACHE_KEYS.NOTES) || [];
  }, [loadFromCache]);

  // Cache reminders
  const cacheReminders = useCallback((reminders) => {
    saveToCache(CACHE_KEYS.REMINDERS, reminders);
  }, [saveToCache]);

  const getCachedReminders = useCallback(() => {
    return loadFromCache(CACHE_KEYS.REMINDERS) || [];
  }, [loadFromCache]);

  // Cache couple data
  const cacheCoupleData = useCallback((coupleData) => {
    saveToCache(CACHE_KEYS.COUPLE_DATA, coupleData);
  }, [saveToCache]);

  const getCachedCoupleData = useCallback(() => {
    return loadFromCache(CACHE_KEYS.COUPLE_DATA);
  }, [loadFromCache]);

  // Cache user preferences
  const cacheUserPreferences = useCallback((preferences) => {
    saveToCache(CACHE_KEYS.USER_PREFERENCES, preferences);
  }, [saveToCache]);

  const getCachedUserPreferences = useCallback(() => {
    return loadFromCache(CACHE_KEYS.USER_PREFERENCES) || {};
  }, [loadFromCache]);

  // Update last sync time
  const updateLastSync = useCallback(() => {
    saveToCache(CACHE_KEYS.LAST_SYNC, Date.now());
  }, [saveToCache]);

  const getLastSync = useCallback(() => {
    return loadFromCache(CACHE_KEYS.LAST_SYNC);
  }, [loadFromCache]);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const info = {};
    Object.entries(CACHE_KEYS).forEach(([key, value]) => {
      try {
        const cached = localStorage.getItem(getUserCacheKey(value));
        if (cached) {
          const cacheData = JSON.parse(cached);
          info[key] = {
            size: new Blob([cached]).size,
            timestamp: cacheData.timestamp,
            isValid: isCacheValid(cacheData.timestamp)
          };
        }
      } catch (error) {
        // Ignore errors
      }
    });
    return info;
  }, [getUserCacheKey, isCacheValid]);

  // Load pending sync on mount
  useEffect(() => {
    if (user) {
      loadPendingSync();
    }
  }, [user, loadPendingSync]);

  return {
    // Status
    isOnline,
    pendingSync,
    
    // Cache operations
    saveToCache,
    loadFromCache,
    clearCache,
    clearAllCache,
    
    // Specific cache methods
    cacheNotes,
    getCachedNotes,
    cacheReminders,
    getCachedReminders,
    cacheCoupleData,
    getCachedCoupleData,
    cacheUserPreferences,
    getCachedUserPreferences,
    
    // Sync operations
    addPendingSync,
    clearPendingSync,
    syncPendingChanges,
    updateLastSync,
    getLastSync,
    
    // Utilities
    getCacheInfo,
    CACHE_KEYS
  };
};