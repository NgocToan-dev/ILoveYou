import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Language,
  Logout,
  Close,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../navigation/BottomNavigation';
import NotificationBell from '../notifications/NotificationBell';
import NotificationIntegration from '../notifications/NotificationIntegration';
import { useAuth } from '../../contexts/AuthContext';

const MobileLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setDrawerOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
            }}
          >
            ILoveYou ❤️
          </Typography>

          <NotificationBell />
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            Menu
          </Typography>
          <IconButton onClick={toggleDrawer}>
            <Close />
          </IconButton>
        </Box>

        <Divider />

        {/* User Profile Section */}
        {user && (
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {user.displayName || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Divider />

        {/* Menu Items */}
        <List>
          <ListItem button onClick={toggleLanguage}>
            <ListItemIcon>
              <Language />
            </ListItemIcon>
            <ListItemText 
              primary={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'} 
            />
          </ListItem>
          
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <Logout color="error" />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItem>
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* Footer */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Made with 💝 for couples
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px - 70px)', // Account for AppBar and BottomNav
          pb: '70px', // Space for bottom navigation
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Notification Integration */}
      <NotificationIntegration />
    </Box>
  );
};

export default MobileLayout;