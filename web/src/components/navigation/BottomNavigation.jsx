import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
} from '@mui/material';
import {
  Home,
  Favorite,
  Note,
  Notifications,
  Person,
} from '@mui/icons-material';

const BottomNavigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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

  const getCurrentValue = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.key : 'home';
  };

  const handleChange = (event, newValue) => {
    const item = navigationItems.find(item => item.key === newValue);
    if (item) {
      navigate(item.path);
    }
  };

  return (
    <Box
      sx={{
        display: { xs: 'block', lg: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Paper
        sx={{
          borderTop: 1,
          borderColor: 'divider',
        }}
        elevation={8}
      >
        <MuiBottomNavigation
          value={getCurrentValue()}
          onChange={handleChange}
          showLabels
          sx={{
            height: 70,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px 8px',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 500,
              '&.Mui-selected': {
                fontSize: '0.75rem',
                fontWeight: 'bold',
              },
            },
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.key}
              value={item.key}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </MuiBottomNavigation>
      </Paper>
    </Box>
  );
};

export default BottomNavigation;