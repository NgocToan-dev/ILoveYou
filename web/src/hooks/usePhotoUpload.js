import { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { useAuthContext } from '@/contexts/AuthContext';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuthContext();

  const uploadPhoto = useCallback(async (file, folder = 'notes') => {
    if (!user || !file) return null;

    setUploading(true);
    setProgress(0);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const filename = `${folder}/${user.uid}/${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, filename);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setProgress(100);
      
      return {
        url: downloadURL,
        path: filename,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [user]);

  const deletePhoto = useCallback(async (photoPath) => {
    if (!photoPath) return;

    try {
      const storageRef = ref(storage, photoPath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting photo:', error);
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

      img.src = URL.createObjectURL(file);
    });
  }, []);

  return {
    uploadPhoto,
    deletePhoto,
    resizeImage,
    uploading,
    progress
  };
};