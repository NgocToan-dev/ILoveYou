import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Box, Skeleton, IconButton } from '@mui/material';
import { BrokenImage, ZoomIn } from '@mui/icons-material';
import 'react-lazy-load-image-component/src/effects/blur.css';

const LazyImage = ({
  src,
  alt,
  width,
  height,
  style = {},
  placeholder,
  onImageClick,
  showZoom = false,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (imageError) {
    return (
      <Box
        sx={{
          width: width || '100%',
          height: height || 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 1,
          ...style
        }}
      >
        <BrokenImage sx={{ fontSize: 48, color: 'grey.400' }} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        display: 'inline-block',
        width: width || '100%',
        height: height || 'auto'
      }}
    >
      <LazyLoadImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        effect="blur"
        style={{
          borderRadius: 8,
          objectFit: 'cover',
          cursor: onImageClick ? 'pointer' : 'default',
          ...style
        }}
        placeholder={
          placeholder || (
            <Skeleton
              variant="rectangular"
              width={width || '100%'}
              height={height || 200}
              sx={{ borderRadius: 1 }}
            />
          )
        }
        onError={handleImageError}
        onLoad={handleImageLoad}
        onClick={onImageClick}
        {...props}
      />
      
      {showZoom && imageLoaded && onImageClick && (
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }
          }}
          size="small"
          onClick={onImageClick}
        >
          <ZoomIn />
        </IconButton>
      )}
    </Box>
  );
};

export default LazyImage;