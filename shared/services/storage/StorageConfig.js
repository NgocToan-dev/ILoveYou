/**
 * Storage Configuration Management
 * Handles storage provider configuration, health checks, and automatic selection
 */

import { storageAdapter } from './StorageAdapter.js';

/**
 * Storage Configuration Manager
 */
export class StorageConfigManager {
  constructor() {
    this.healthCheckInterval = null;
    this.lastHealthCheck = null;
    this.healthCheckResults = {};
    this.listeners = new Set();
  }

  /**
   * Get current storage configuration
   * @returns {Object}
   */
  getConfiguration() {
    return {
      primary: storageAdapter.getPrimaryProviderName(),
      fallback: storageAdapter.getFallbackProviderName(),
      enableFallback: import.meta.env?.VITE_STORAGE_FALLBACK !== 'false',
      autoFailover: import.meta.env?.VITE_STORAGE_AUTO_FAILOVER !== 'false',
      healthCheckInterval: parseInt(import.meta.env?.VITE_STORAGE_HEALTH_CHECK_INTERVAL) || 60000,
      lastHealthCheck: this.lastHealthCheck,
      healthStatus: this.healthCheckResults
    };
  }

  /**
   * Update storage provider configuration
   * @param {Object} config - New configuration
   */
  async updateConfiguration(config) {
    try {
      if (config.primary) {
        storageAdapter.setPrimaryProvider(config.primary);
      }

      if (config.fallback) {
        storageAdapter.setFallbackProvider(config.fallback);
      }

      // Restart health checks if interval changed
      if (config.healthCheckInterval && config.healthCheckInterval !== this.getConfiguration().healthCheckInterval) {
        this.stopHealthChecks();
        this.startHealthChecks(config.healthCheckInterval);
      }

      this.notifyListeners('configurationUpdated', this.getConfiguration());
      
      console.log('Storage configuration updated:', this.getConfiguration());
    } catch (error) {
      console.error('Failed to update storage configuration:', error);
      throw error;
    }
  }

  /**
   * Start automatic health checks
   * @param {number} interval - Check interval in milliseconds
   */
  startHealthChecks(interval = 60000) {
    this.stopHealthChecks();

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);

    // Perform initial health check
    this.performHealthCheck();

    console.log(`Storage health checks started with ${interval}ms interval`);
  }

  /**
   * Stop automatic health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform a comprehensive health check
   * @returns {Promise<Object>}
   */
  async performHealthCheck() {
    try {
      this.lastHealthCheck = new Date().toISOString();
      
      // Get status from storage adapter
      const providersStatus = await storageAdapter.getProvidersStatus();
      
      // Perform additional connectivity tests
      const healthResults = {
        timestamp: this.lastHealthCheck,
        primary: {
          name: providersStatus.primary.name,
          healthy: providersStatus.primary.healthy,
          latency: null,
          error: null
        },
        fallback: {
          name: providersStatus.fallback.name,
          healthy: providersStatus.fallback.healthy,
          latency: null,
          error: null
        },
        recommendations: []
      };

      // Test primary provider latency
      if (providersStatus.primary.healthy) {
        try {
          const startTime = Date.now();
          await this.testProviderConnectivity(providersStatus.primary.name);
          healthResults.primary.latency = Date.now() - startTime;
        } catch (error) {
          healthResults.primary.healthy = false;
          healthResults.primary.error = error.message;
        }
      }

      // Test fallback provider latency
      if (providersStatus.fallback.healthy) {
        try {
          const startTime = Date.now();
          await this.testProviderConnectivity(providersStatus.fallback.name);
          healthResults.fallback.latency = Date.now() - startTime;
        } catch (error) {
          healthResults.fallback.healthy = false;
          healthResults.fallback.error = error.message;
        }
      }

      // Generate recommendations
      healthResults.recommendations = this.generateRecommendations(healthResults);

      // Store results
      this.healthCheckResults = healthResults;

      // Notify listeners
      this.notifyListeners('healthCheckCompleted', healthResults);

      // Auto-switch providers if needed
      if (this.shouldAutoSwitch(healthResults)) {
        await this.performAutoSwitch(healthResults);
      }

      return healthResults;
    } catch (error) {
      console.error('Health check failed:', error);
      const errorResult = {
        timestamp: this.lastHealthCheck,
        error: error.message,
        primary: { healthy: false, error: error.message },
        fallback: { healthy: false, error: error.message },
        recommendations: ['Check storage configuration and network connectivity']
      };
      
      this.healthCheckResults = errorResult;
      this.notifyListeners('healthCheckFailed', errorResult);
      
      return errorResult;
    }
  }

  /**
   * Test provider connectivity
   * @param {string} providerName - Name of the provider to test
   * @returns {Promise<boolean>}
   */
  async testProviderConnectivity(providerName) {
    // Simple connectivity test - attempt to list files in root
    try {
      // Create a test adapter with specific provider
      if (providerName === 'minio') {
        // Test MinIO connectivity
        await storageAdapter.providers.get('minio').isHealthy();
        return true;
      }
      
      return false;
    } catch (error) {
      throw new Error(`Connectivity test failed for ${providerName}: ${error.message}`);
    }
  }

  /**
   * Generate health check recommendations
   * @param {Object} healthResults - Health check results
   * @returns {Array<string>}
   */
  generateRecommendations(healthResults) {
    const recommendations = [];

    // Check if MinIO provider is down
    if (!healthResults.primary.healthy) {
      recommendations.push(`MinIO provider is unhealthy. Check MinIO server connection and configuration.`);
    }

    // Check latency issues
    if (healthResults.primary.latency > 5000) {
      recommendations.push(`MinIO provider has high latency (${healthResults.primary.latency}ms). Check network connection.`);
    }

    // MinIO-specific recommendations
    if (!healthResults.primary.healthy) {
      recommendations.push('Verify MinIO server is running and accessible.');
      recommendations.push('Check MinIO credentials and bucket configuration.');
      recommendations.push('Ensure network connectivity to MinIO endpoint.');
    }

    return recommendations;
  }

  /**
   * Determine if automatic provider switching should occur
   * @param {Object} healthResults - Health check results
   * @returns {boolean}
   */
  shouldAutoSwitch(healthResults) {
    // No auto-switching in MinIO-only setup
    return false;
  }

  /**
   * Perform automatic provider switching
   * @param {Object} healthResults - Health check results
   */
  async performAutoSwitch(healthResults) {
    // No auto-switching in MinIO-only setup
    console.log('Auto-switching not available in MinIO-only configuration');
  }

  /**
   * Manually switch storage providers
   * @param {string} newPrimary - New primary provider name
   * @param {string} newFallback - New fallback provider name (optional)
   */
  async switchProviders(newPrimary, newFallback = null) {
    // Only MinIO is available
    if (newPrimary !== 'minio') {
      throw new Error('Only MinIO provider is available in this configuration');
    }

    const switchEvent = {
      timestamp: new Date().toISOString(),
      oldPrimary: 'minio',
      newPrimary: 'minio',
      oldFallback: 'none',
      newFallback: 'none',
      automatic: false,
      message: 'No switching required - MinIO is the only provider'
    };

    this.notifyListeners('providerSwitched', switchEvent);
    
    // Perform immediate health check
    await this.performHealthCheck();
    
    return switchEvent;
  }

  /**
   * Add event listener
   * @param {Function} listener - Event listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener
   * @param {Function} listener - Event listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of an event
   * @param {string} eventType - Type of event
   * @param {*} data - Event data
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, data);
      } catch (error) {
        console.error('Error in storage config listener:', error);
      }
    });
  }

  /**
   * Get storage provider statistics
   * @returns {Object}
   */
  getProviderStatistics() {
    return {
      configuration: this.getConfiguration(),
      healthCheck: this.healthCheckResults,
      uptime: this.getUptimeStatistics(),
      usage: this.getUsageStatistics()
    };
  }

  /**
   * Get uptime statistics (placeholder)
   * @returns {Object}
   */
  getUptimeStatistics() {
    // TODO: Implement uptime tracking
    return {
      primary: { uptime: '99.9%', downtime: '0.1%' },
      fallback: { uptime: '99.8%', downtime: '0.2%' },
      note: 'Uptime tracking to be implemented'
    };
  }

  /**
   * Get usage statistics (placeholder)
   * @returns {Object}
   */
  getUsageStatistics() {
    // TODO: Implement usage tracking
    return {
      primary: { requests: 0, bytes: 0, errors: 0 },
      fallback: { requests: 0, bytes: 0, errors: 0 },
      note: 'Usage tracking to be implemented'
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopHealthChecks();
    this.listeners.clear();
    this.healthCheckResults = {};
    this.lastHealthCheck = null;
  }
}

// Create and export singleton instance
export const storageConfigManager = new StorageConfigManager();

// Storage utility functions
export const StorageUtils = {
  /**
   * Get current storage status
   * @returns {Promise<Object>}
   */
  async getStorageStatus() {
    return await storageAdapter.getProvidersStatus();
  },

  /**
   * Test storage connectivity
   * @returns {Promise<boolean>}
   */
  async testConnectivity() {
    try {
      await storageConfigManager.performHealthCheck();
      return true;
    } catch (error) {
      console.error('Storage connectivity test failed:', error);
      return false;
    }
  },

  /**
   * Get recommended storage configuration
   * @returns {Object}
   */
  getRecommendedConfiguration() {
    return {
      primary: 'firebase',
      fallback: 'minio',
      enableFallback: true,
      autoFailover: true,
      healthCheckInterval: 60000
    };
  },

  /**
   * Validate storage configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object}
   */
  validateConfiguration(config) {
    const errors = [];
    const warnings = [];

    if (!config.primary) {
      errors.push('Primary storage provider is required');
    }

    if (config.primary !== 'minio') {
      errors.push('Only MinIO provider is supported in this configuration');
    }

    if (config.enableFallback) {
      warnings.push('Fallback not available in MinIO-only configuration');
    }

    if (config.healthCheckInterval && config.healthCheckInterval < 10000) {
      warnings.push('Health check interval less than 10 seconds may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};

export default storageConfigManager;