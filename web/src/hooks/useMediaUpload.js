import { useState, useCallback } from 'react';
import { storageAdapter } from '../../../shared/services/storage/index.js';
import { useAuth } from '@/contexts/AuthContext';

export const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  // Video file formats supported
  const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov', '.avi', '.webm'];
  const SUPPORTED_IMAGE_FORMATS = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
  
  // File size limits (in bytes)
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
  const VIDEO_COMPRESSION_THRESHOLD = 50 * 1024 * 1024; // 50MB

  const validateFile = useCallback((file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isVideo = SUPPORTED_VIDEO_FORMATS.includes(fileExtension);
    const isImage = SUPPORTED_IMAGE_FORMATS.includes(fileExtension);
    
    if (!isVideo && !isImage) {
      throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: ${[...SUPPORTED_IMAGE_FORMATS, ...SUPPORTED_VIDEO_FORMATS].join(', ')}`);
    }
    
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      throw new Error(`Video file too large. Maximum size: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
    }
    
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new Error(`Image file too large. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
    }
    
    return { isVideo, isImage, fileExtension };
  }, []);

  const compressVideo = useCallback(async (file) => {
    // For now, return the original file
    // In a future enhancement, we could implement video compression using FFmpeg.js
    if (file.size > VIDEO_COMPRESSION_THRESHOLD) {
      console.warn(`Video file is large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Consider implementing video compression.`);
    }
    return file;
  }, []);

  const uploadMedia = useCallback(async (file, folder = 'notes') => {
    if (!user || !file) return null;

    setUploading(true);
    setProgress(0);

    try {
      // Validate file
      const { isVideo, isImage } = validateFile(file);
      
      // Process file if needed
      let processedFile = file;
      if (isVideo) {
        processedFile = await compressVideo(file);
      } else if (isImage) {
        // Use existing image resizing for images
        processedFile = await resizeImage(file);
      }
      
      // Create a unique filename with proper path structure
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const filename = `${folder}/${user.uid}/${timestamp}.${fileExtension}`;
      
      // Prepare metadata for storage adapter
      const metadata = {
        originalName: file.name,
        contentType: file.type,
        originalSize: file.size,
        processedSize: processedFile.size,
        isVideo,
        isImage,
        userId: user.uid,
        folder: folder,
        timestamp: timestamp
      };

      // Use storage adapter with progress callback
      const uploadResult = await storageAdapter.uploadFile(
        processedFile,
        filename,
        metadata,
        (progressPercent) => {
          setProgress(Math.round(progressPercent));
        }
      );

      setProgress(100);

      const result = {
        url: uploadResult.url,
        path: uploadResult.path,
        name: file.name,
        size: processedFile.size,
        originalSize: file.size,
        type: file.type,
        isVideo,
        isImage,
        uploadedAt: new Date().toISOString(),
        provider: uploadResult.provider,
        usedFallback: uploadResult.usedFallback,
        metadata: uploadResult.metadata
      };

      setTimeout(() => setProgress(0), 1000); // Clear progress after 1 second
      return result;

    } catch (error) {
      console.error('Error uploading media:', error);
      setUploading(false);
      setProgress(0);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [user, validateFile, compressVideo, resizeImage]);

  const deleteMedia = useCallback(async (mediaPath) => {
    if (!mediaPath) return;

    try {
      const deleteResult = await storageAdapter.deleteFile(mediaPath);
      console.log(`Media deleted using ${deleteResult.provider} provider${deleteResult.usedFallback ? ' (fallback)' : ''}`);
      return deleteResult;
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }, []);

  const resizeImage = useCallback((file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(resolve, file.type, quality);
      };

      img.onerror = () => {
        // If image processing fails, return original file
        resolve(file);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const generateVideoThumbnail = useCallback((file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = 1; // Seek to 1 second
      });
      
      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
      });
      
      video.addEventListener('error', () => {
        resolve(null);
      });
      
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Backward compatibility - keep the original uploadPhoto method
  const uploadPhoto = useCallback(async (file, folder = 'notes') => {
    return uploadMedia(file, folder);
  }, [uploadMedia]);

  // Backward compatibility - keep the original deletePhoto method  
  const deletePhoto = useCallback(async (photoPath) => {
    return deleteMedia(photoPath);
  }, [deleteMedia]);

  return {
    // New methods
    uploadMedia,
    deleteMedia,
    validateFile,
    generateVideoThumbnail,
    
    // Original methods for backward compatibility
    uploadPhoto,
    deletePhoto,
    resizeImage,
    
    // State
    uploading,
    progress,
    
    // Constants for external use
    SUPPORTED_VIDEO_FORMATS,
    SUPPORTED_IMAGE_FORMATS,
    MAX_VIDEO_SIZE,
    MAX_IMAGE_SIZE
  };
};

// Export the old hook name for backward compatibility
export const usePhotoUpload = useMediaUpload;