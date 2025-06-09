import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const AuthGuard = ({ children, requireAuth = true }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  // If auth is required but user is not authenticated, redirect to login
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If auth is not required but user is authenticated, redirect to home
  if (!requireAuth && user) {
    // Don't redirect from welcome page
    if (location.pathname === '/welcome') {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  // Render children if auth requirements are met
  return children;
};

export default AuthGuard;