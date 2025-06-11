/**
 * MinIO Configuration for Backend
 */

const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio123',
  bucketName: process.env.MINIO_BUCKET_NAME || 'iloveyou-app',
  region: process.env.MINIO_REGION || 'us-east-1',
  consoleUrl: process.env.MINIO_CONSOLE_URL || 'http://localhost:9001'
};

module.exports = minioConfig;
