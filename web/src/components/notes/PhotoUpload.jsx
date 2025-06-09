import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  LinearProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import { 
  CloudUpload, 
  Delete, 
  Photo,
  Close
} from '@mui/icons-material';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useTranslation } from 'react-i18next';

const PhotoUpload = ({ photos = [], onPhotosChange, maxPhotos = 5 }) => {
  const { t } = useTranslation();
  const { uploadPhoto, deletePhoto, resizeImage, uploading, progress } = usePhotoUpload();

  const onDrop = useCallback(async (acceptedFiles) => {
    const newPhotos = [...photos];
    
    for (const file of acceptedFiles) {
      if (newPhotos.length >= maxPhotos) break;
      
      try {
        // Resize image before upload
        const resizedFile = await resizeImage(file);
        
        // Upload to Firebase Storage
        const photoData = await uploadPhoto(resizedFile, 'notes');
        
        if (photoData) {
          newPhotos.push(photoData);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }
    
    onPhotosChange(newPhotos);
  }, [photos, maxPhotos, uploadPhoto, resizeImage, onPhotosChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: maxPhotos - photos.length,
    disabled: uploading || photos.length >= maxPhotos
  });

  const handleDeletePhoto = async (index) => {
    const photoToDelete = photos[index];
    
    try {
      await deletePhoto(photoToDelete.path);
      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  return (
    <Box>
      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: uploading ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            mb: 2,
            opacity: uploading ? 0.6 : 1
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload 
            sx={{ 
              fontSize: 48, 
              color: 'grey.400', 
              mb: 1 
            }} 
          />
          <Typography variant="body1" color="textSecondary">
            {isDragActive
              ? t('notes.photos.dropHere')
              : t('notes.photos.dragAndDrop')
            }
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {t('notes.photos.supportedFormats')} • {t('notes.photos.maxPhotos', { max: maxPhotos })}
          </Typography>
        </Paper>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            {t('notes.photos.uploading')}...
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <ImageList cols={3} gap={8}>
          {photos.map((photo, index) => (
            <ImageListItem key={index}>
              <img
                src={photo.url}
                alt={photo.name}
                loading="lazy"
                style={{
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 8
                }}
              />
              <ImageListItemBar
                sx={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                }}
                position="top"
                actionIcon={
                  <IconButton
                    sx={{ color: 'white' }}
                    onClick={() => handleDeletePhoto(index)}
                    size="small"
                  >
                    <Close />
                  </IconButton>
                }
                actionPosition="right"
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          {t('notes.photos.photoCount', { count: photos.length, max: maxPhotos })}
        </Typography>
      )}
    </Box>
  );
};

export default PhotoUpload;