/**
 * Backend Storage Provider
 * Communicates with backend API for storage operations
 */

import { StorageProviderInterface } from '../StorageProviderInterface.js';
import backendApi from '../../../web/src/services/backendApi';

export class BackendStorageProvider extends StorageProviderInterface {
  constructor() {
    super();
    this.providerName = 'backend';
    this.isConnected = true; // Assume connected since it's API-based
  }

  /**
   * Upload a file to storage via backend API
   * @param {File} file - The file to upload
   * @param {string} path - The storage path
   * @param {Object} metadata - Additional metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<{url: string, path: string, metadata: Object}>}
   */
  async uploadFile(file, path, metadata = {}, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      if (Object.keys(metadata).length > 0) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Use backend API to upload file
      const response = await backendApi.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Upload failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('BackendStorageProvider.uploadFile error:', error);
      throw this.handleBackendError(error);
    }
  }

  /**
   * Download a file from storage via backend API
   * @param {string} path - The storage path
   * @returns {Promise<Blob>}
   */
  async downloadFile(path) {
    try {
      const response = await backendApi.get(`/storage/download/${path}`, {
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('BackendStorageProvider.downloadFile error:', error);
      throw this.handleBackendError(error);
    }
  }

  /**
   * Delete a file from storage via backend API
   * @param {string} path - The storage path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    try {
      const response = await backendApi.delete(`/storage/${path}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('BackendStorageProvider.deleteFile error:', error);
      throw this.handleBackendError(error);
    }
  }

  /**
   * Get file URL from storage via backend API
   * @param {string} path - The storage path
   * @returns {Promise<string>}
   */
  async getFileUrl(path) {
    try {
      const response = await backendApi.get(`/storage/url/${path}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Get URL failed');
      }
      return response.data.data.url;
    } catch (error) {
      console.error('BackendStorageProvider.getFileUrl error:', error);
      throw this.handleBackendError(error);
    }
  }

  /**
   * List files in a directory via backend API
   * @param {string} prefix - The directory prefix
   * @returns {Promise<FileInfo[]>}
   */
  async listFiles(prefix) {
    try {
      const response = await backendApi.get(`/storage/list/${prefix || ''}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'List files failed');
      }
      return response.data.data;
    } catch (error) {
      console.error('BackendStorageProvider.listFiles error:', error);
      throw this.handleBackendError(error);
    }
  }

  /**
   * Check if storage is healthy via backend API
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      const response = await backendApi.get('/storage/status');
      if (!response.data.success) {
        return false;
      }
      return response.data.data.connected;
    } catch (error) {
      console.warn('Backend storage health check failed:', error);
      return false;
    }
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getProviderName() {
    return this.providerName;
  }

  /**
   * Handle backend API errors
   * @param {Error} error - The backend error
   * @returns {Error} Normalized error
   */
  handleBackendError(error) {
    const message = error.response?.data?.error || error.message || 'Backend Storage error';
    
    const normalizedError = new Error(message);
    normalizedError.code = error.response?.data?.code || 'BACKEND_STORAGE_ERROR';
    normalizedError.originalError = error;
    normalizedError.provider = this.providerName;
    
    return normalizedError;
  }

  /**
   * Get configuration status
   * @returns {Object}
   */
  getConfigurationStatus() {
    return {
      provider: this.providerName,
      configured: true,
      connected: this.isConnected,
      implementationStatus: 'Backend API'
    };
  }

  /**
   * Check if provider is ready for use
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected;
  }
}

export default BackendStorageProvider;
