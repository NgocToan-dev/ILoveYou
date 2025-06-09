import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Home,
  Favorite,
  Note,
  Notifications,
  Person,
  Logout,
  Language,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;

const SidebarNavigation = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigationItems = [
    {
      key: 'home',
      label: t('navigation.tabs.home'),
      icon: <Home />,
      path: '/',
    },
    {
      key: 'couple',
      label: 'Kết nối', // t('navigation.tabs.couple')
      icon: <Favorite />,
      path: '/couple',
    },
    {
      key: 'notes',
      label: 'Ghi chú', // t('navigation.tabs.notes')
      icon: <Note />,
      path: '/notes',
    },
    {
      key: 'reminders',
      label: 'Nhắc nhở', // t('navigation.tabs.reminders')
      icon: <Notifications />,
      path: '/reminders',
    },
    {
      key: 'profile',
      label: t('navigation.tabs.profile'),
      icon: <Person />,
      path: '/profile',
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Favorite sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" fontWeight="bold" color="primary.main">
          ILoveYou
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Ứng dụng tình yêu
        </Typography>
      </Box>

      {/* User Profile Section */}
      {user && (
        <Box sx={{ px: 3, py: 2 }}>
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

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.key} disablePadding sx={{ px: 2 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Bottom Actions */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Tooltip title="Đổi ngôn ngữ">
            <IconButton onClick={toggleLanguage} size="small">
              <Language />
            </IconButton>
          </Tooltip>
          <Tooltip title="Đăng xuất">
            <IconButton onClick={handleLogout} size="small" color="error">
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Made with 💝 for couples
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        display: { xs: 'none', lg: 'block' },
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default SidebarNavigation;
export { DRAWER_WIDTH };