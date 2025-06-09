import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Container,
} from '@mui/material';
import { Favorite } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SignUpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = t('auth.validation.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('auth.validation.nameMinLength');
    }

    if (!formData.email) {
      newErrors.email = t('auth.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.validation.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.validation.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordsNoMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
      navigate('/welcome');
    } catch (error) {
      console.error('Signup error:', error);
      setServerError(error.message || t('auth.errors.signUpFailed'));
    } finally {
      setLoading(false);
    }
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
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Favorite
                sx={{
                  fontSize: 48,
                  color: 'primary.main',
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                }}
              >
                {t('auth.signUp.title')}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                {t('auth.signUp.subtitle')}
              </Typography>
            </Box>

            {/* Error Alert */}
            {serverError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {serverError}
              </Alert>
            )}

            {/* SignUp Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                name="name"
                type="text"
                label={t('auth.signUp.namePlaceholder')}
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
                margin="normal"
                variant="outlined"
                autoComplete="name"
                autoFocus
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                  },
                }}
              />

              <TextField
                fullWidth
                name="email"
                type="email"
                label={t('auth.signUp.emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading}
                margin="normal"
                variant="outlined"
                autoComplete="email"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                  },
                }}
              />

              <TextField
                fullWidth
                name="password"
                type="password"
                label={t('auth.signUp.passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                disabled={loading}
                margin="normal"
                variant="outlined"
                autoComplete="new-password"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                  },
                }}
              />

              <TextField
                fullWidth
                name="confirmPassword"
                type="password"
                label={t('auth.signUp.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading}
                margin="normal"
                variant="outlined"
                autoComplete="new-password"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {t('auth.signUp.loadingMessage')}
                  </>
                ) : (
                  t('auth.signUp.signUpButton')
                )}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.signUp.or')}
                </Typography>
              </Divider>

              <Button
                component={Link}
                to="/login"
                fullWidth
                variant="outlined"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                }}
              >
                {t('auth.signUp.signInButton')}
              </Button>
            </Box>

            {/* Footer */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 3,
                fontStyle: 'italic',
              }}
            >
              {t('auth.signUp.footerText')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SignUpPage;