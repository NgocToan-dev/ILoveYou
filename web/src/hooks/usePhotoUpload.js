// Deprecated: Use useMediaUpload instead for new implementations
// This file is kept for backward compatibility
import { useMediaUpload } from './useMediaUpload';

export const usePhotoUpload = () => {
  const mediaUpload = useMediaUpload();
  
  // Return the same interface but using the new media upload hook
  return {
    uploadPhoto: mediaUpload.uploadPhoto,
    deletePhoto: mediaUpload.deletePhoto,
    resizeImage: mediaUpload.resizeImage,
    uploading: mediaUpload.uploading,
    progress: mediaUpload.progress
  };
};