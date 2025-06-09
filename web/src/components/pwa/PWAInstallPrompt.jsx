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
  Slide,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Close,
  InstallMobile,
  GetApp,
  PhoneIphone,
  Computer,
  Share,
  Add,  Home,
  Notifications,
  CloudOff,
  Speed,
  Security,
  CheckCircle,
  ArrowForward,
  Favorite,
  EmojiEvents
} from '@mui/icons-material';
import { usePWA } from '@/hooks/usePWA';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PWAInstallPrompt = () => {
  const { t } = useTranslation();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  
  const {
    showInstallPrompt,
    dismissInstallPrompt,
    installApp,
    getInstallInstructions,
    isInstalled
  } = usePWA();

  const {
    permission: notificationPermission,
    supported: notificationSupported,
    requestPermission: requestNotificationPermission
  } = useNotifications();

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await installApp();
    setIsInstalling(false);
    
    if (success) {
      // Show enhanced setup flow after successful install
      dismissInstallPrompt();
      setShowEnhancedPrompt(true);
      setSetupStep(0);
    } else {
      // Show manual instructions if automatic install failed
      setShowInstructions(true);
    }
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
    dismissInstallPrompt();
  };

  const handleEnhancedInstall = () => {
    dismissInstallPrompt();
    setShowEnhancedPrompt(true);
  };

  const handleSetupComplete = () => {
    setShowEnhancedPrompt(false);
    setSetupStep(0);
  };

  const handleNextStep = async () => {
    if (setupStep === 0) {
      // Install app step
      setIsInstalling(true);
      const success = await installApp();
      setIsInstalling(false);
      
      if (success || !installApp) {
        setSetupStep(1);
      }
    } else if (setupStep === 1) {
      // Notification permission step
      if (notificationSupported && notificationPermission !== 'granted') {
        const result = await requestNotificationPermission();
        if (result.success) {
          setSetupStep(2);
        }
      } else {
        setSetupStep(2);
      }
    } else if (setupStep === 2) {
      // Complete setup
      handleSetupComplete();
    }
  };

  const handleSkipStep = () => {
    if (setupStep < 2) {
      setSetupStep(setupStep + 1);
    } else {
      handleSetupComplete();
    }
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
            maxWidth: 450,
            background: 'linear-gradient(45deg, #e91e63 30%, #f06292 90%)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
          icon={<InstallMobile />}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleEnhancedInstall}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
                variant="outlined"
                disabled={isInstalling}
              >
                {isInstalling ? 'Đang cài đặt...' : 'Cài đặt PWA'}
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={handleShowInstructions}
                sx={{ color: 'white' }}
              >
                Hướng dẫn
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
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            Cài đặt ILoveYou như ứng dụng di động 💕
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            Trải nghiệm tốt hơn với thông báo tình yêu và sử dụng ngoại tuyến
          </Typography>
          
          {/* Enhanced Benefits */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip
              icon={<Notifications />}
              label="Thông báo"
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />            <Chip
              icon={<CloudOff />}
              label="Ngoại tuyến"
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
            <Chip
              icon={<Speed />}
              label="Nhanh hơn"
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Box>
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

      {/* Enhanced Setup Dialog */}
      <Dialog
        open={showEnhancedPrompt}
        onClose={() => setShowEnhancedPrompt(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InstallMobile sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              Thiết lập ILoveYou PWA
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Chỉ cần vài bước để có trải nghiệm tuyệt vời nhất với ứng dụng tình yêu của chúng ta
          </Typography>

          <Stepper activeStep={setupStep} orientation="vertical">
            {/* Step 1: Install App */}
            <Step>
              <StepLabel>
                <Typography variant="subtitle1">
                  Cài đặt ứng dụng
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Cài đặt ILoveYou như một ứng dụng trên thiết bị của bạn để truy cập nhanh chóng
                  </Typography>
                  
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Speed sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Khởi động nhanh hơn" />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Home sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Biểu tượng trên màn hình chính" />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Security sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Bảo mật và riêng tư" />
                      </ListItem>
                    </List>
                  </Paper>

                  {isInstalling && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Đang cài đặt ứng dụng...
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleNextStep}
                    disabled={isInstalling}
                    startIcon={isInstalling ? null : <InstallMobile />}
                  >
                    {isInstalling ? 'Đang cài đặt...' : 'Cài đặt ngay'}
                  </Button>
                  <Button onClick={handleSkipStep}>
                    Bỏ qua
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Enable Notifications */}
            <Step>
              <StepLabel>
                <Typography variant="subtitle1">
                  Bật thông báo tình yêu
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Nhận thông báo về nhắc nhở, tin nhắn tình yêu và những khoảnh khắc đặc biệt
                  </Typography>

                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Notifications sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Nhắc nhở tình yêu"
                          secondary="Không bao giờ quên những điều quan trọng"
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Favorite sx={{ color: 'pink.500' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Tin nhắn ngọt ngào"
                          secondary="Những lời nhắn lãng mạn từ người yêu"
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <EmojiEvents sx={{ color: 'orange.500' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Cột mốc đặc biệt"
                          secondary="Chúc mừng những ngày kỷ niệm"
                        />
                      </ListItem>
                    </List>
                  </Paper>

                  {notificationPermission === 'granted' && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <CheckCircle sx={{ mr: 1 }} />
                      Thông báo đã được bật thành công!
                    </Alert>
                  )}

                  {!notificationSupported && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Thiết bị của bạn không hỗ trợ thông báo
                    </Alert>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {notificationSupported && notificationPermission !== 'granted' ? (
                    <Button
                      variant="contained"
                      onClick={handleNextStep}
                      startIcon={<Notifications />}
                    >
                      Bật thông báo
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNextStep}
                      startIcon={<ArrowForward />}
                    >
                      Tiếp tục
                    </Button>
                  )}
                  <Button onClick={handleSkipStep}>
                    Bỏ qua
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Complete */}
            <Step>
              <StepLabel>
                <Typography variant="subtitle1">
                  Hoàn thành thiết lập
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <CheckCircle sx={{ mr: 1 }} />
                    Thiết lập hoàn tất! ILoveYou đã sẵn sàng mang đến trải nghiệm tình yêu tuyệt vời.
                  </Alert>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Bây giờ bạn có thể:
                  </Typography>

                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Sử dụng ứng dụng ngay cả khi không có mạng" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Nhận thông báo tình yêu quan trọng" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Truy cập nhanh từ màn hình chính" />
                    </ListItem>
                  </List>
                </Box>
                
                <Button
                  variant="contained"
                  onClick={handleSetupComplete}
                  startIcon={<CheckCircle />}
                  size="large"
                  fullWidth
                >
                  Bắt đầu sử dụng ILoveYou
                </Button>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowEnhancedPrompt(false)}>
            Đóng
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