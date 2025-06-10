import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import NotificationBell from '../notifications/NotificationBell';

/**
 * PageHeader Component
 * 
 * Note: NotificationBell is disabled by default because:
 * - DesktopLayout already has NotificationBell in its AppBar
 * - MobileLayout already has NotificationBell in its AppBar
 * This prevents duplicate notification bells on the same page.
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  icon, 
  showNotificationBell = false, // Đặt mặc định là false vì Layout đã có NotificationBell
  centered = false,
  children 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Hoàn toàn không hiển thị notification bell vì DesktopLayout và MobileLayout đã có
  const shouldShowNotificationBell = false;

  return (
    <Box sx={{ 
      mb: 3, 
      textAlign: centered ? 'center' : 'left', 
      position: 'relative' 
    }}>
      {/* Notification Bell - Đã bị vô hiệu hóa vì Layout đã có */}
      {shouldShowNotificationBell && showNotificationBell && (
        <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
          <NotificationBell />
        </Box>
      )}
      
      {/* Title with Icon */}
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: centered ? 'center' : 'flex-start',
          gap: 1,
          fontWeight: centered ? 'bold' : 'normal',
          color: centered ? 'primary.main' : 'inherit'
        }}
      >
        {icon}
        {title}
      </Typography>
      
      {/* Subtitle */}
      {subtitle && (
        <Typography 
          variant={centered ? "h6" : "body1"} 
          color="text.secondary"
          sx={{ mb: centered ? 3 : 0 }}
        >
          {subtitle}
        </Typography>
      )}
      
      {/* Additional content */}
      {children}
    </Box>
  );
};

export default PageHeader; 