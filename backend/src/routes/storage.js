/**
 * Storage Routes
 * Handles file storage operations through MinIO on the backend
 */

const express = require('express');
const router = express.Router();
const minioService = require('../services/minioService');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Initialize MinIO service on server start
minioService.initializeClient().catch(err => {
  console.error('Failed to initialize MinIO service:', err);
});

// Middleware to check if MinIO is connected
const checkMinIOConnection = async (req, res, next) => {
  try {
    await minioService.initializeClient();
    if (!minioService.isConnected) {
      return res.status(503).json({
        success: false,
        error: 'Storage service is not connected',
      });
    }
    next();
  } catch (error) {
    console.error('MinIO connection check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Storage service initialization failed',
      details: error.message,
    });
  }
};

// Upload a file
router.post('/upload', authMiddleware, checkMinIOConnection, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const file = req.file;
    const filePath = req.body.path || `uploads/${Date.now()}-${file.originalname}`;
    const metadata = {
      contentType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
      customMetadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
    };

    const result = await minioService.uploadFile(file.buffer, filePath, metadata);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: error.message,
    });
  }
});

// Download a file
router.get('/download/:path(*)', authMiddleware, checkMinIOConnection, async (req, res) => {
  try {
    const filePath = req.params.path;
    const fileBuffer = await minioService.downloadFile(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      details: error.message,
    });
  }
});

// Get file URL (presigned URL for access)
router.get('/url/:path(*)', authMiddleware, checkMinIOConnection, async (req, res) => {
  try {
    const filePath = req.params.path;
    const url = await minioService.getFileUrl(filePath);
    res.json({
      success: true,
      data: {
        url,
        path: filePath,
      },
    });
  } catch (error) {
    console.error('Get file URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file URL',
      details: error.message,
    });
  }
});

// Delete a file
router.delete('/:path(*)', authMiddleware, checkMinIOConnection, async (req, res) => {
  try {
    const filePath = req.params.path;
    await minioService.deleteFile(filePath);
    res.json({
      success: true,
      message: 'File deleted successfully',
      path: filePath,
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      details: error.message,
    });
  }
});

// List files in a directory
router.get('/list/:prefix(*)?', authMiddleware, checkMinIOConnection, async (req, res) => {
  try {
    const prefix = req.params.prefix || '';
    const files = await minioService.listFiles(prefix);
    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      details: error.message,
    });
  }
});

// Get storage status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const isConnected = minioService.isConnected;
    if (!isConnected) {
      await minioService.initializeClient();
    }
    res.json({
      success: true,
      data: {
        connected: minioService.isConnected,
        provider: minioService.providerName,
        endpoint: minioService.config.endPoint,
        bucket: minioService.config.bucketName,
      },
    });
  } catch (error) {
    console.error('Storage status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check storage status',
      details: error.message,
    });
  }
});

module.exports = router;
