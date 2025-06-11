/**
 * Storage Provider Interface
 * Base interface that all storage providers must implement
 */

export class StorageProviderInterface {
  /**
   * Upload a file to storage
   * @param {File} file - The file to upload
   * @param {string} path - The storage path
   * @param {Object} metadata - Additional metadata
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<{url: string, path: string, metadata: Object}>}
   */
  async uploadFile(file, path, metadata = {}, onProgress = null) {
    throw new Error('uploadFile method must be implemented');
  }

  /**
   * Download a file from storage
   * @param {string} path - The storage path
   * @returns {Promise<Blob>}
   */
  async downloadFile(path) {
    throw new Error('downloadFile method must be implemented');
  }

  /**
   * Delete a file from storage
   * @param {string} path - The storage path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    throw new Error('deleteFile method must be implemented');
  }

  /**
   * Get file URL
   * @param {string} path - The storage path
   * @returns {Promise<string>}
   */
  async getFileUrl(path) {
    throw new Error('getFileUrl method must be implemented');
  }

  /**
   * List files in a directory
   * @param {string} prefix - The directory prefix
   * @returns {Promise<FileInfo[]>}
   */
  async listFiles(prefix) {
    throw new Error('listFiles method must be implemented');
  }

  /**
   * Check if provider is available/healthy
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    throw new Error('isHealthy method must be implemented');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getProviderName() {
    throw new Error('getProviderName method must be implemented');
  }
}

export default StorageProviderInterface;