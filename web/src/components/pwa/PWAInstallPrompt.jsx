import React, { useState } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slide
} from '@mui/material';
import {
  Close,
  InstallMobile,
  GetApp,
  PhoneIphone,
  Computer,
  Share,
  Add,
  Home
} from '@mui/icons-material';
import { usePWA } from '@/hooks/usePWA';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PWAInstallPrompt = () => {
  const { t } = useTranslation();
  const [showInstructions, setShowInstructions] = useState(false);
  const {
    showInstallPrompt,
    dismissInstallPrompt,
    installApp,
    getInstallInstructions,
    isInstalled
  } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (!success) {
      // Show manual instructions if automatic install failed
      setShowInstructions(true);
    }
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
    dismissInstallPrompt();
  };

  const instructions = getInstallInstructions();

  const getIcon = (platform) => {
    switch (platform) {
      case 'ios':
        return <PhoneIphone />;
      case 'android':
        return <InstallMobile />;
      default:
        return <Computer />;
    }
  };

  const getStepIcon = (step, platform) => {
    if (platform === 'ios') {
      if (step === 0) return <Share />;
      if (step === 1) return <Add />;
      if (step === 2) return <Home />;
    }
    return <GetApp />;
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Main Install Prompt */}
      <Snackbar
        open={showInstallPrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 7, sm: 0 } }} // Account for mobile bottom navigation
      >
        <Alert
          severity="info"
          sx={{
            width: '100%',
            maxWidth: 400,
            background: 'linear-gradient(45deg, #e91e63 30%, #f06292 90%)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
          icon={<InstallMobile />}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleInstall}
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
                variant="outlined"
              >
                {t('pwa.install.install')}
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={handleShowInstructions}
                sx={{ color: 'white' }}
              >
                {t('pwa.install.howTo')}
              </Button>
              <IconButton
                size="small"
                onClick={dismissInstallPrompt}
                sx={{ color: 'white' }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {t('pwa.install.promptTitle')}
          </Typography>
          <Typography variant="caption">
            {t('pwa.install.promptDescription')}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Installation Instructions Dialog */}
      <Dialog
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getIcon(instructions.platform)}
            <Typography variant="h6">
              {instructions.title}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('pwa.install.instructionsDescription')}
          </Typography>

          <List>
            {instructions.steps.map((step, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={step}
                  sx={{ ml: 1 }}
                />
              </ListItem>
            ))}
          </List>

          {/* Benefits */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('pwa.install.benefits.title')}
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={t('pwa.install.benefits.offline')}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={t('pwa.install.benefits.faster')}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={t('pwa.install.benefits.notifications')}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={t('pwa.install.benefits.homeScreen')}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowInstructions(false)}>
            {t('pwa.install.gotIt')}
          </Button>
          <Button 
            onClick={handleInstall}
            variant="contained"
            startIcon={<InstallMobile />}
          >
            {t('pwa.install.tryAgain')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// PWA Update Prompt Component
export const PWAUpdatePrompt = () => {
  const { t } = useTranslation();
  const { needRefresh, updateApp, closeUpdatePrompt } = usePWA();

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" size="small" onClick={updateApp}>
              {t('pwa.update.update')}
            </Button>
            <IconButton size="small" onClick={closeUpdatePrompt}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Typography variant="body2">
          {t('pwa.update.available')}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

// PWA Offline Ready Prompt Component
export const PWAOfflinePrompt = () => {
  const { t } = useTranslation();
  const { offlineReady, closeOfflinePrompt } = usePWA();

  return (
    <Snackbar
      open={offlineReady}
      autoHideDuration={5000}
      onClose={closeOfflinePrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={closeOfflinePrompt}
        severity="success"
        sx={{ width: '100%' }}
      >
        <Typography variant="body2">
          {t('pwa.offline.ready')}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default PWAInstallPrompt;