/**
 * Storage Abstraction Layer - Main Adapter
 * Provides a unified interface for different storage providers
 */

import { StorageProviderInterface } from './StorageProviderInterface.js';
import { MinIOStorageProvider } from './providers/MinIOStorageProvider.js';
import { BackendStorageProvider } from './providers/BackendStorageProvider.js';
import { minioConfig } from '../firebase/config.js';

// Storage configuration with backend as primary provider
const storageConfig = {
  provider: import.meta.env?.VITE_STORAGE_PROVIDER || 'backend',
  enableFallback: true,
  autoFailover: true,
  healthCheckInterval: parseInt(import.meta.env?.VITE_STORAGE_HEALTH_CHECK_INTERVAL) || 60000
};

/**
 * Main Storage Adapter Class
 * Manages multiple storage providers with fallback support
 */
export class StorageAdapter {
  constructor() {
    this.providers = new Map();
    this.primaryProvider = null;
    this.fallbackProvider = null;
    this.isInitialized = false;
    this.healthCheckInterval = null;
    
    // Initialize providers
    this.initializeProviders();
  }

  /**
   * Initialize storage providers based on configuration
   */
  initializeProviders() {
    try {
      // Initialize providers
      const backendProvider = new BackendStorageProvider();
      const minioProvider = new MinIOStorageProvider();
      this.providers.set('backend', backendProvider);
      this.providers.set('minio', minioProvider);

      // Set primary provider based on configuration
      const primaryProviderName = storageConfig.provider;
      this.setPrimaryProvider(primaryProviderName);
      
      // Set fallback provider if enabled
      if (storageConfig.enableFallback && primaryProviderName === 'backend') {
        this.setFallbackProvider('minio');
      } else if (storageConfig.enableFallback && primaryProviderName === 'minio') {
        this.setFallbackProvider('backend');
      } else {
        this.fallbackProvider = null;
      }

      this.isInitialized = true;
      
      // Start health checks
      this.startHealthChecks();

      console.log('StorageAdapter initialized:', {
        primary: this.getPrimaryProviderName(),
        fallback: this.getFallbackProviderName(),
        enableFallback: storageConfig.enableFallback
      });
    } catch (error) {
      console.error('Failed to initialize StorageAdapter:', error);
      throw error;
    }
  }

  /**
   * Set the primary storage provider
   * @param {string} providerName - Name of the provider
   */
  setPrimaryProvider(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }
    this.primaryProvider = provider;
  }

  /**
   * Set the fallback storage provider
   * @param {string} providerName - Name of the provider
   */
  setFallbackProvider(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      console.warn(`Fallback provider '${providerName}' not found`);
      return;
    }
    this.fallbackProvider = provider;
  }

  /**
   * Get the name of the primary provider
   * @returns {string}
   */
  getPrimaryProviderName() {
    return this.primaryProvider?.getProviderName() || 'unknown';
  }

  /**
   * Get the name of the fallback provider
   * @returns {string}
   */
  getFallbackProviderName() {
    return this.fallbackProvider?.getProviderName() || 'none';
  }

  /**
   * Execute a method with automatic failover
   * @param {string} method - Method name to execute
   * @param {...any} args - Arguments to pass to the method
   * @returns {Promise<any>}
   */
  async executeWithFailover(method, ...args) {
    if (!this.isInitialized) {
      throw new Error('StorageAdapter not initialized');
    }

    if (this.primaryProvider) {
      try {
        const result = await this.primaryProvider[method](...args);
        return {
          result,
          provider: this.getPrimaryProviderName(),
          usedFallback: false
        };
      } catch (error) {
        console.error(`Primary provider (${this.getPrimaryProviderName()}) failed for method ${method}:`, error);
        
        // Attempt failover if enabled and fallback provider exists
        if (storageConfig.enableFallback && storageConfig.autoFailover && this.fallbackProvider) {
          console.log(`Attempting failover to ${this.getFallbackProviderName()} provider...`);
          try {
            const fallbackResult = await this.fallbackProvider[method](...args);
            console.log(`Failover to ${this.getFallbackProviderName()} successful`);
            return {
              result: fallbackResult,
              provider: this.getFallbackProviderName(),
              usedFallback: true
            };
          } catch (fallbackError) {
            console.error(`Fallback provider (${this.getFallbackProviderName()}) also failed:`, fallbackError);
            throw new Error(`Storage operation failed on both providers: Primary error: ${error.message}, Fallback error: ${fallbackError.message}`);
          }
        }
        
        // If no fallback or failover disabled, throw the original error
        throw error;
      }
    }

    throw new Error('No storage provider available');
  }

  /**
   * Upload a file with automatic failover
   * @param {File} file - The file to upload
   * @param {string} path - The storage path
   * @param {Object} metadata - Additional metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<{url: string, path: string, metadata: Object, provider: string, usedFallback: boolean}>}
   */
  async uploadFile(file, path, metadata = {}, onProgress = null) {
    const response = await this.executeWithFailover('uploadFile', file, path, metadata, onProgress);
    return {
      ...response.result,
      provider: response.provider,
      usedFallback: response.usedFallback
    };
  }

  /**
   * Download a file with automatic failover
   * @param {string} path - The storage path
   * @returns {Promise<{blob: Blob, provider: string, usedFallback: boolean}>}
   */
  async downloadFile(path) {
    const response = await this.executeWithFailover('downloadFile', path);
    return {
      blob: response.result,
      provider: response.provider,
      usedFallback: response.usedFallback
    };
  }

  /**
   * Delete a file with automatic failover
   * @param {string} path - The storage path
   * @returns {Promise<{provider: string, usedFallback: boolean}>}
   */
  async deleteFile(path) {
    const response = await this.executeWithFailover('deleteFile', path);
    return {
      provider: response.provider,
      usedFallback: response.usedFallback
    };
  }

  /**
   * Get file URL with automatic failover
   * @param {string} path - The storage path
   * @returns {Promise<{url: string, provider: string, usedFallback: boolean}>}
   */
  async getFileUrl(path) {
    const response = await this.executeWithFailover('getFileUrl', path);
    return {
      url: response.result,
      provider: response.provider,
      usedFallback: response.usedFallback
    };
  }

  /**
   * List files with automatic failover
   * @param {string} prefix - The directory prefix
   * @returns {Promise<{files: FileInfo[], provider: string, usedFallback: boolean}>}
   */
  async listFiles(prefix) {
    const response = await this.executeWithFailover('listFiles', prefix);
    return {
      files: response.result,
      provider: response.provider,
      usedFallback: response.usedFallback
    };
  }

  /**
   * Start periodic health checks for providers
   */
  startHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Check every minute
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform health checks on all providers
   */
  async performHealthChecks() {
    const healthStatus = {};

    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.isHealthy();
        healthStatus[name] = isHealthy;
      } catch (error) {
        console.warn(`Health check failed for provider ${name}:`, error);
        healthStatus[name] = false;
      }
    }

    console.log('Storage providers health status:', healthStatus);
    return healthStatus;
  }

  /**
   * Get the status of all providers
   * @returns {Promise<Object>}
   */
  async getProvidersStatus() {
    const status = {
      primary: {
        name: this.getPrimaryProviderName(),
        healthy: false
      },
      fallback: {
        name: this.getFallbackProviderName(),
        healthy: false
      },
      config: storageConfig
    };

    try {
      if (this.primaryProvider) {
        status.primary.healthy = await this.primaryProvider.isHealthy();
      }
    } catch (error) {
      console.warn('Primary provider health check failed:', error);
    }

    try {
      if (this.fallbackProvider) {
        status.fallback.healthy = await this.fallbackProvider.isHealthy();
      }
    } catch (error) {
      console.warn('Fallback provider health check failed:', error);
    }

    return status;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopHealthChecks();
    this.providers.clear();
    this.primaryProvider = null;
    this.fallbackProvider = null;
    this.isInitialized = false;
  }
}

// Create and export singleton instance
export const storageAdapter = new StorageAdapter();
export default storageAdapter;
