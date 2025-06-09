import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBackground = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.background.default}, ${theme.palette.secondary.light})`,
  minHeight: '100vh',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFB6C1" fill-opacity="0.1"%3E%3Cpath d="M30 30c0-11.046-8.954-20-20-20S-10 18.954-10 30s8.954 20 20 20 20-8.954 20-20z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
}));

const LoveBackground = ({ children, ...props }) => {
  return (
    <StyledBackground {...props}>
      <Box position="relative" zIndex={1} minHeight="100vh">
        {children}
      </Box>
    </StyledBackground>
  );
};

export default LoveBackground;