import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { Language, Logout } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SidebarNavigation, { DRAWER_WIDTH } from '../navigation/SidebarNavigation';
import NotificationBell from '../notifications/NotificationBell';
import NotificationIntegration from '../notifications/NotificationIntegration';
import { useAuth } from '../../contexts/AuthContext';

const DesktopLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top App Bar */}
        <AppBar
          position="sticky"
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
          elevation={0}
        >
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              ILoveYou ❤️
            </Typography>

            {/* Top Bar Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationBell />
              
              <Tooltip title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}>
                <IconButton onClick={toggleLanguage} color="inherit">
                  <Language />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Đăng xuất">
                <IconButton onClick={handleLogout} color="error">
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 64px)', // Account for AppBar height
          }}
        >
          {children}
        </Box>

        {/* Notification Integration */}
        <NotificationIntegration />
      </Box>
    </Box>
  );
};

export default DesktopLayout;