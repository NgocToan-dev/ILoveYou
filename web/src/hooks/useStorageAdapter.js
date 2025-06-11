/**
 * React Hook for Storage Adapter
 * Provides easy access to storage functionality with React integration
 */

import { useState, useEffect, useCallback } from 'react';
import { storageAdapter, storageConfigManager } from '../../../shared/services/storage/index.js';

export const useStorageAdapter = () => {
  const [storageStatus, setStorageStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get storage status
  const getStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await storageAdapter.getProvidersStatus();
      setStorageStatus(status);
      setError(null);
      return status;
    } catch (err) {
      console.error('Failed to get storage status:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload file with storage adapter
  const uploadFile = useCallback(async (file, path, metadata = {}, onProgress = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await storageAdapter.uploadFile(file, path, metadata, onProgress);
      return result;
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Download file with storage adapter
  const downloadFile = useCallback(async (path) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await storageAdapter.downloadFile(path);
      return result;
    } catch (err) {
      console.error('Download failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete file with storage adapter
  const deleteFile = useCallback(async (path) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await storageAdapter.deleteFile(path);
      return result;
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get file URL with storage adapter
  const getFileUrl = useCallback(async (path) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await storageAdapter.getFileUrl(path);
      return result;
    } catch (err) {
      console.error('Get file URL failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // List files with storage adapter
  const listFiles = useCallback(async (prefix) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await storageAdapter.listFiles(prefix);
      return result;
    } catch (err) {
      console.error('List files failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch storage providers
  const switchProviders = useCallback(async (newPrimary, newFallback = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await storageConfigManager.switchProviders(newPrimary, newFallback);
      await getStatus(); // Refresh status after switch
      return result;
    } catch (err) {
      console.error('Provider switch failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getStatus]);

  // Perform health check
  const performHealthCheck = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await storageConfigManager.performHealthCheck();
      await getStatus(); // Refresh status after health check
      return result;
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getStatus]);

  // Get configuration
  const getConfiguration = useCallback(() => {
    return storageConfigManager.getConfiguration();
  }, []);

  // Update configuration
  const updateConfiguration = useCallback(async (config) => {
    try {
      setIsLoading(true);
      setError(null);
      await storageConfigManager.updateConfiguration(config);
      await getStatus(); // Refresh status after configuration update
      return storageConfigManager.getConfiguration();
    } catch (err) {
      console.error('Configuration update failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getStatus]);

  // Initialize storage status on mount
  useEffect(() => {
    getStatus();
  }, [getStatus]);

  // Listen for storage events
  useEffect(() => {
    const handleStorageEvent = (eventType, data) => {
      console.log(`Storage event: ${eventType}`, data);
      
      // Refresh status when providers are switched
      if (eventType === 'providerSwitched') {
        getStatus();
      }
      
      // Update error state on failures
      if (eventType === 'providerSwitchFailed' || eventType === 'healthCheckFailed') {
        setError(data.error || 'Storage operation failed');
      }
    };

    storageConfigManager.addListener(handleStorageEvent);

    return () => {
      storageConfigManager.removeListener(handleStorageEvent);
    };
  }, [getStatus]);

  return {
    // Storage operations
    uploadFile,
    downloadFile,
    deleteFile,
    getFileUrl,
    listFiles,

    // Provider management
    switchProviders,
    performHealthCheck,
    getConfiguration,
    updateConfiguration,

    // Status and state
    storageStatus,
    getStatus,
    isLoading,
    error,

    // Utility functions
    getPrimaryProvider: () => storageAdapter.getPrimaryProviderName(),
    getFallbackProvider: () => storageAdapter.getFallbackProviderName(),
    isHealthy: () => storageStatus?.primary?.healthy || false,
    hasFallback: () => storageStatus?.fallback?.healthy || false,
    
    // Clear error
    clearError: useCallback(() => setError(null), [])
  };
};

export default useStorageAdapter;