import React from 'react';
import MediaUpload from './MediaUpload';

// Backward compatibility wrapper for PhotoUpload
// This component now uses MediaUpload but filters to only show images
const PhotoUpload = ({ photos = [], onPhotosChange, maxPhotos = 5 }) => {
  
  // Convert photos array to media format for MediaUpload
  const mediaFromPhotos = photos.map(photo => ({
    ...photo,
    isImage: true,
    isVideo: false
  }));

  // Handle media changes and filter out videos, convert back to photos format
  const handleMediaChange = (mediaArray) => {
    const photosOnly = mediaArray
      .filter(item => item.isImage || !item.isVideo) // Keep only images
      .map(item => ({
        url: item.url,
        path: item.path,
        name: item.name,
        size: item.size,
        type: item.type,
        uploadedAt: item.uploadedAt
      }));
    
    onPhotosChange(photosOnly);
  };

  return (
    <MediaUpload
      media={mediaFromPhotos}
      onMediaChange={handleMediaChange}
      maxMedia={maxPhotos}
    />
  );
};

export default PhotoUpload;