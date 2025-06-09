import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { Favorite, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const WelcomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: (theme) => theme.shadows[8],
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* Success Icon */}
            <Box sx={{ mb: 3 }}>
              <CheckCircle
                sx={{
                  fontSize: 64,
                  color: 'success.main',
                  mb: 2,
                }}
              />
              <Favorite
                sx={{
                  fontSize: 32,
                  color: 'primary.main',
                  position: 'relative',
                  top: -8,
                  left: -8,
                }}
              />
            </Box>

            {/* Welcome Message */}
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 2,
              }}
            >
              {t('auth.signUp.welcomeTitle')}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.6 }}
            >
              {t('auth.signUp.welcomeMessage')}
            </Typography>

            {/* User Info */}
            {user && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  mb: 3,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Chào mừng:
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {user.displayName || user.email}
                </Typography>
              </Box>
            )}

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                mt: 2,
              }}
            >
              Bắt đầu hành trình tình yêu 💕
            </Button>

            {/* Footer */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mt: 3,
                fontStyle: 'italic',
              }}
            >
              Hãy cùng nhau tạo nên những kỷ niệm đẹp! 🌟
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default WelcomePage;