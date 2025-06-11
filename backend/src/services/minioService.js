/**
 * MinIO Service for Backend
 * Handles file storage operations using MinIO SDK
 */

const Minio = require('minio');
const minioConfig = require('../config/minio');

class MinIOService {
  constructor() {
    this.config = minioConfig;
    this.providerName = 'minio';
    this.isConnected = false;
    this.minioClient = null;
    this.initPromise = null;
  }

  /**
   * Initialize MinIO connection using SDK
   */
  async initializeClient() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      // Instantiate the MinIO client with the object store service
      // endpoint and an authorized user's credentials
      this.minioClient = new Minio.Client({
        endPoint: this.config.endPoint,
        port: this.config.port,
        useSSL: this.config.useSSL,
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
      });

      console.log('Instantiating MinIO client with endpoint:', this.config.endPoint);
      console.log('Using bucket:', this.config.bucketName);

      // Check if the bucket exists
      // If it doesn't, create it
      const exists = await this.minioClient.bucketExists(this.config.bucketName);
      if (exists) {
        console.log('Bucket ' + this.config.bucketName + ' exists.');
      } else {
        await this.minioClient.makeBucket(this.config.bucketName, this.config.region || 'us-east-1');
        console.log('Bucket ' + this.config.bucketName + ' created in "' + (this.config.region || 'us-east-1') + '".');
      }

      this.isConnected = true;
      console.log('MinIO client initialized successfully with endpoint ' + this.config.endPoint);
      return true;
    } catch (error) {
      console.error('MinIO client initialization failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Upload a file to MinIO Storage using SDK
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} path - The storage path
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<{url: string, path: string, metadata: Object}>}
   */
  async uploadFile(fileBuffer, path, metadata = {}) {
    try {
      await this.initializeClient();

      if (!this.isConnected) {
        throw new Error('MinIO client not connected');
      }

      // Set the object metadata
      const metaData = {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'X-Amz-Meta-UploadedAt': new Date().toISOString(),
        'X-Amz-Meta-Provider': this.providerName,
        'X-Amz-Meta-OriginalName': metadata.originalName || path.split('/').pop(),
        'X-Amz-Meta-Size': (metadata.size || fileBuffer.length).toString(),
        ...metadata.customMetadata
      };

      console.log(`Uploading file to bucket '${this.config.bucketName}' with object name '${path}'`);

      // Upload the file with putObject
      await this.minioClient.putObject(this.config.bucketName, path, fileBuffer, fileBuffer.length, metaData);
      
      const resultUrl = this.getPublicUrl(path);
      console.log(`File uploaded successfully to ${resultUrl}`);

      return {
        url: resultUrl,
        path: path,
        metadata: {
          ...metaData,
          bucket: this.config.bucketName,
          region: this.config.region
        }
      };
    } catch (error) {
      console.error('MinIOService.uploadFile error:', error);
      throw this.handleMinIOError(error);
    }
  }

  /**
   * Download a file from MinIO Storage
   * @param {string} path - The storage path
   * @returns {Promise<Buffer>}
   */
  async downloadFile(path) {
    try {
      await this.initializeClient();

      if (!this.isConnected) {
        throw new Error('MinIO client not connected');
      }

      // Get object from MinIO
      const stream = await this.minioClient.getObject(this.config.bucketName, path);
      
      // Convert stream to buffer
      const chunks = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('MinIOService.downloadFile error:', error);
      throw this.handleMinIOError(error);
    }
  }

  /**
   * Delete a file from MinIO Storage
   * @param {string} path - The storage path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    try {
      await this.initializeClient();

      if (!this.isConnected) {
        throw new Error('MinIO client not connected');
      }

      // Remove object from MinIO
      await this.minioClient.removeObject(this.config.bucketName, path);
      console.log('File ' + path + ' deleted successfully from bucket ' + this.config.bucketName);
    } catch (error) {
      console.error('MinIOService.deleteFile error:', error);
      throw this.handleMinIOError(error);
    }
  }

  /**
   * Get file URL from MinIO Storage
   * @param {string} path - The storage path
   * @returns {Promise<string>}
   */
  async getFileUrl(path) {
    try {
      await this.initializeClient();

      if (!this.isConnected) {
        throw new Error('MinIO client not connected');
      }

      // Generate presigned URL for GET operation (valid for 24 hours)
      const presignedUrl = await this.minioClient.presignedGetObject(this.config.bucketName, path, 24 * 60 * 60);
      return presignedUrl;
    } catch (error) {
      console.error('MinIOService.getFileUrl error:', error);
      throw this.handleMinIOError(error);
    }
  }

  /**
   * Get public URL for a file
   * @param {string} path - The storage path
   * @returns {string}
   */
  getPublicUrl(path) {
    const protocol = this.config.useSSL ? 'https' : 'http';
    const port = this.config.port !== 80 && this.config.port !== 443 ? `:${this.config.port}` : '';
    return `${protocol}://${this.config.endPoint}${port}/${this.config.bucketName}/${path}`;
  }

  /**
   * List files in a MinIO Storage directory
   * @param {string} prefix - The directory prefix
   * @returns {Promise<FileInfo[]>}
   */
  async listFiles(prefix) {
    try {
      await this.initializeClient();

      if (!this.isConnected) {
        throw new Error('MinIO client not connected');
      }

      // Use MinIO SDK to list objects
      const files = [];
      const objectsStream = this.minioClient.listObjects(this.config.bucketName, prefix, true);

      return new Promise((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          files.push({
            name: obj.name.split('/').pop(),
            fullPath: obj.name,
            size: obj.size || 0,
            lastModified: obj.lastModified,
            etag: obj.etag?.replace(/"/g, ''),
            contentType: 'application/octet-stream',
            provider: this.providerName
          });
        });

        objectsStream.on('end', () => {
          resolve(files);
        });

        objectsStream.on('error', (error) => {
          console.error('MinIOService.listFiles error:', error);
          reject(this.handleMinIOError(error));
        });
      });
    } catch (error) {
      console.error('MinIOService.listFiles error:', error);
      throw this.handleMinIOError(error);
    }
  }

  /**
   * Handle MinIO errors
   * @param {Error} error - The MinIO error
   * @returns {Error} Normalized error
   */
  handleMinIOError(error) {
    const message = error.message || 'MinIO Storage error';
    
    const normalizedError = new Error(message);
    normalizedError.code = error.code || 'MINIO_ERROR';
    normalizedError.originalError = error;
    normalizedError.provider = this.providerName;
    
    return normalizedError;
  }
}

// Create and export singleton instance
const minioService = new MinIOService();
module.exports = minioService;
