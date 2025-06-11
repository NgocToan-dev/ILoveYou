import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  LinearProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Chip,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  CloudUpload, 
  Delete, 
  Photo,
  VideoFile,
  PlayArrow,
  Close,
  Warning
} from '@mui/icons-material';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useTranslation } from 'react-i18next';

const MediaUpload = ({ media = [], onMediaChange, maxMedia = 5 }) => {
  const { t } = useTranslation();
  const { 
    uploadMedia, 
    deleteMedia, 
    generateVideoThumbnail,
    uploading, 
    progress,
    SUPPORTED_VIDEO_FORMATS,
    SUPPORTED_IMAGE_FORMATS,
    MAX_VIDEO_SIZE,
    MAX_IMAGE_SIZE
  } = useMediaUpload();

  const [error, setError] = useState('');
  const [videoThumbnails, setVideoThumbnails] = useState({});

  const onDrop = useCallback(async (acceptedFiles) => {
    const newMedia = [...media];
    setError('');
    
    for (const file of acceptedFiles) {
      if (newMedia.length >= maxMedia) break;
      
      try {
        // Show compression warning for large videos
        if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) {
          setError(t('notes.media.largeVideoWarning'));
        }

        // Generate thumbnail for video files
        let thumbnail = null;
        if (file.type.startsWith('video/')) {
          thumbnail = await generateVideoThumbnail(file);
          if (thumbnail) {
            const thumbnailUrl = URL.createObjectURL(thumbnail);
            setVideoThumbnails(prev => ({
              ...prev,
              [file.name]: thumbnailUrl
            }));
          }
        }
        
        // Upload media to Firebase Storage
        const mediaData = await uploadMedia(file, 'notes');
        
        if (mediaData) {
          newMedia.push({
            ...mediaData,
            thumbnail: thumbnail ? URL.createObjectURL(thumbnail) : null
          });
        }
      } catch (error) {
        console.error('Error uploading media:', error);
        setError(error.message || t('notes.media.uploadError'));
      }
    }
    
    onMediaChange(newMedia);
  }, [media, maxMedia, uploadMedia, generateVideoThumbnail, onMediaChange, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': SUPPORTED_IMAGE_FORMATS,
      'video/*': SUPPORTED_VIDEO_FORMATS
    },
    maxFiles: maxMedia - media.length,
    disabled: uploading || media.length >= maxMedia
  });

  const handleDeleteMedia = async (index) => {
    const mediaToDelete = media[index];
    
    try {
      await deleteMedia(mediaToDelete.path);
      
      // Clean up video thumbnail URL
      if (mediaToDelete.isVideo && mediaToDelete.thumbnail) {
        URL.revokeObjectURL(mediaToDelete.thumbnail);
        setVideoThumbnails(prev => {
          const newThumbnails = { ...prev };
          delete newThumbnails[mediaToDelete.name];
          return newThumbnails;
        });
      }
      
      const newMedia = media.filter((_, i) => i !== index);
      onMediaChange(newMedia);
    } catch (error) {
      console.error('Error deleting media:', error);
      setError(t('notes.media.deleteError'));
    }
  };

  const getMediaIcon = (mediaItem) => {
    if (mediaItem.isVideo) {
      return <VideoFile sx={{ fontSize: 20 }} />;
    }
    return <Photo sx={{ fontSize: 20 }} />;
  };

  const getFileTypeChip = (mediaItem) => {
    if (mediaItem.isVideo) {
      return (
        <Chip 
          label="Video" 
          size="small" 
          color="secondary"
          icon={<VideoFile sx={{ fontSize: 16 }} />}
          sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
        />
      );
    }
    return null;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      {media.length < maxMedia && (
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
              ? t('notes.media.dropHere')
              : t('notes.media.dragAndDrop')
            }
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
            {t('notes.media.supportedFormats')}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {t('notes.media.maxMedia', { max: maxMedia })}
          </Typography>
        </Paper>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            {t('notes.media.uploading')}...
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            {progress}%
          </Typography>
        </Box>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <ImageList cols={3} gap={8}>
          {media.map((mediaItem, index) => (
            <ImageListItem key={index} sx={{ position: 'relative' }}>
              {getFileTypeChip(mediaItem)}
              
              {mediaItem.isVideo ? (
                <Box
                  sx={{
                    height: 120,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {mediaItem.thumbnail ? (
                    <img
                      src={mediaItem.thumbnail}
                      alt={mediaItem.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                    />
                  ) : (
                    <VideoFile sx={{ fontSize: 40, color: 'grey.500' }} />
                  )}
                  <PlayArrow
                    sx={{
                      position: 'absolute',
                      fontSize: 30,
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: '50%',
                      p: 0.5
                    }}
                  />
                </Box>
              ) : (
                <img
                  src={mediaItem.url}
                  alt={mediaItem.name}
                  loading="lazy"
                  style={{
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 8
                  }}
                />
              )}
              
              <ImageListItemBar
                sx={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                }}
                position="top"
                actionIcon={
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      sx={{ color: 'white' }}
                      onClick={() => handleDeleteMedia(index)}
                      size="small"
                    >
                      <Close />
                    </IconButton>
                  </Tooltip>
                }
                actionPosition="right"
              />
              
              {/* File size indicator for large files */}
              {(mediaItem.size > 5 * 1024 * 1024) && (
                <Tooltip title={`${(mediaItem.size / (1024 * 1024)).toFixed(1)}MB`}>
                  <Warning
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      color: 'orange',
                      fontSize: 20
                    }}
                  />
                </Tooltip>
              )}
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Media Count */}
      {media.length > 0 && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          {t('notes.media.mediaCount', { count: media.length, max: maxMedia })}
        </Typography>
      )}
    </Box>
  );
};

export default MediaUpload;