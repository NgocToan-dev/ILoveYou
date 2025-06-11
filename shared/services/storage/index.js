/**
 * Storage Services Index
 * Main entry point for the Storage Abstraction Layer
 */

// Core storage adapter
export {
  StorageAdapter,
  storageAdapter
} from './StorageAdapter.js';

// Storage provider interface
export { StorageProviderInterface } from './StorageProviderInterface.js';

// Storage providers
export { MinIOStorageProvider } from './providers/MinIOStorageProvider.js';
export { BackendStorageProvider } from './providers/BackendStorageProvider.js';

// Configuration management
export {
  StorageConfigManager,
  storageConfigManager,
  StorageUtils
} from './StorageConfig.js';

// Import for local use in utility functions
import storageAdapterInstance from './StorageAdapter.js';

// Re-export the default storage adapter instance for easy access
export default storageAdapterInstance;

/**
 * Quick access functions for common storage operations
 */

/**
 * Upload a file using the storage adapter
 * @param {File} file - The file to upload
 * @param {string} path - The storage path
 * @param {Object} metadata - Additional metadata
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>}
 */
export const uploadFile = async (file, path, metadata = {}, onProgress = null) => {
  return await storageAdapterInstance.uploadFile(file, path, metadata, onProgress);
};

/**
 * Download a file using the storage adapter
 * @param {string} path - The storage path
 * @returns {Promise<Object>}
 */
export const downloadFile = async (path) => {
  return await storageAdapterInstance.downloadFile(path);
};

/**
 * Delete a file using the storage adapter
 * @param {string} path - The storage path
 * @returns {Promise<Object>}
 */
export const deleteFile = async (path) => {
  return await storageAdapterInstance.deleteFile(path);
};

/**
 * Get file URL using the storage adapter
 * @param {string} path - The storage path
 * @returns {Promise<Object>}
 */
export const getFileUrl = async (path) => {
  return await storageAdapterInstance.getFileUrl(path);
};

/**
 * List files using the storage adapter
 * @param {string} prefix - The directory prefix
 * @returns {Promise<Object>}
 */
export const listFiles = async (prefix) => {
  return await storageAdapterInstance.listFiles(prefix);
};

/**
 * Get storage status
 * @returns {Promise<Object>}
 */
export const getStorageStatus = async () => {
  return await storageAdapterInstance.getProvidersStatus();
};
