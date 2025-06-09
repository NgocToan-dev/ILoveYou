import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Alert,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  Collapse,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  Schedule,
  Language,
  Vibration,
  VolumeUp,  ExpandMore,
  ExpandLess,
  Science,
  CheckCircle,
  Error,
  Info,
  Warning,
  NotificationImportant,
  Favorite,
  CalendarToday,
  EmojiEvents
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';

const NotificationSettings = () => {
  const { user } = useAuth();
  const {
    permission,
    supported,
    fcmSupported,
    isAvailable,
    isFCMAvailable,
    loading,
    error,
    requestPermission,
    getPreferences,
    updatePreferences,
    testNotification,
    testFCMNotification,
    comprehensiveTest,
    getSystemStatus
  } = useNotifications();

  // State
  const [preferences, setPreferences] = useState({
    enabled: true,
    reminders: true,
    coupleReminders: true,
    loveMessages: true,
    peacefulDaysMilestones: true,
    language: 'vi',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    vibration: true,
    sound: true
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    types: false,
    advanced: false,
    testing: false
  });

  const [savingPreferences, setSavingPreferences] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingStatus, setTestingStatus] = useState({
    local: null,
    fcm: null,
    comprehensive: null
  });
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (user) {
        try {
          const result = await getPreferences();
          if (result.success && result.preferences) {
            setPreferences(prev => ({
              ...prev,
              ...result.preferences
            }));
          }
        } catch (err) {
          console.error('Error loading notification preferences:', err);
        }
      }
    };

    loadPreferences();
  }, [user, getPreferences]);

  // Handle preference updates
  const handlePreferenceChange = (path, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      if (path.includes('.')) {
        const keys = path.split('.');
        let current = newPrefs;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        newPrefs[path] = value;
      }
      return newPrefs;
    });
  };

  // Save preferences
  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      const result = await updatePreferences(preferences);
      
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('Failed to save preferences:', result.error);
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSavingPreferences(false);
    }
  };

  // Request permission
  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.success) {
      alert('Không thể bật thông báo. Vui lòng kiểm tra cài đặt trình duyệt.');
    }
  };

  // Test notifications
  const handleTest = async (type) => {
    setTestingStatus(prev => ({ ...prev, [type]: 'testing' }));
    
    try {
      let result;
      switch (type) {
        case 'local':
          result = await testNotification();
          break;
        case 'fcm':
          result = await testFCMNotification(preferences.language);
          break;
        case 'comprehensive':
          result = await comprehensiveTest();
          break;
        default:
          return;
      }

      setTestingStatus(prev => ({
        ...prev,
        [type]: result.success ? 'success' : 'error'
      }));
      
      setTimeout(() => {
        setTestingStatus(prev => ({ ...prev, [type]: null }));
      }, 3000);
    } catch (err) {
      setTestingStatus(prev => ({ ...prev, [type]: 'error' }));
      setTimeout(() => {
        setTestingStatus(prev => ({ ...prev, [type]: null }));
      }, 3000);
    }
  };

  // Show system status
  const handleShowSystemStatus = () => {
    setSystemStatus(getSystemStatus());
    setShowTestDialog(true);
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {      case 'testing':
        return <Science sx={{ color: 'warning.main' }} />;
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  if (!supported) {
    return (
      <Paper sx={{ p: 3, m: 2 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Thông báo không được hỗ trợ
          </Typography>
          <Typography>
            Trình duyệt của bạn không hỗ trợ thông báo đẩy. Vui lòng sử dụng trình duyệt hiện đại hơn.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Notifications sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Cài đặt thông báo
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Quản lý cách bạn nhận thông báo về nhắc nhở và tin nhắn tình yêu
        </Typography>

        {/* Save Success Alert */}
        <Collapse in={saveSuccess}>
          <Alert severity="success" sx={{ mt: 2 }}>
            Đã lưu cài đặt thông báo thành công!
          </Alert>
        </Collapse>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Permission Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Trạng thái thông báo
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {permission === 'granted' ? (
                <CheckCircle sx={{ color: 'success.main' }} />
              ) : (
                <NotificationsOff sx={{ color: 'warning.main' }} />
              )}
              <Typography variant="body2">
                {permission === 'granted' ? 'Thông báo đã được bật' : 'Thông báo chưa được bật'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            {permission !== 'granted' && (
              <Button
                variant="contained"
                onClick={handleRequestPermission}
                startIcon={<Notifications />}
                disabled={loading}
              >
                Bật thông báo
              </Button>
            )}
          </Grid>
        </Grid>

        {/* FCM Status */}
        {permission === 'granted' && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isFCMAvailable ? (
                <CheckCircle sx={{ color: 'success.main' }} />
              ) : (
                <Warning sx={{ color: 'warning.main' }} />
              )}
              <Typography variant="body2">
                {isFCMAvailable 
                  ? 'Thông báo nền hoạt động tốt' 
                  : 'Thông báo nền chưa sẵn sàng'
                }
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Basic Settings */}
      <Paper sx={{ mb: 3 }}>
        <Box
          sx={{ p: 3, cursor: 'pointer' }}
          onClick={() => toggleSection('basic')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Cài đặt cơ bản</Typography>
            {expandedSections.basic ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </Box>
        
        <Collapse in={expandedSections.basic}>
          <Box sx={{ px: 3, pb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.enabled}
                  onChange={(e) => handlePreferenceChange('enabled', e.target.checked)}
                  disabled={permission !== 'granted'}
                />
              }
              label="Bật tất cả thông báo"
              sx={{ mb: 2 }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Ngôn ngữ thông báo</InputLabel>
                  <Select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    startAdornment={<Language sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="vi">Tiếng Việt</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.vibration}
                        onChange={(e) => handlePreferenceChange('vibration', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Vibration />
                        <Typography variant="body2">Rung</Typography>
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.sound}
                        onChange={(e) => handlePreferenceChange('sound', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VolumeUp />
                        <Typography variant="body2">Âm thanh</Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Notification Types */}
      <Paper sx={{ mb: 3 }}>
        <Box
          sx={{ p: 3, cursor: 'pointer' }}
          onClick={() => toggleSection('types')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Loại thông báo</Typography>
            {expandedSections.types ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </Box>
        
        <Collapse in={expandedSections.types}>
          <Box sx={{ px: 3, pb: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationImportant />
                </ListItemIcon>
                <ListItemText
                  primary="Nhắc nhở cá nhân"
                  secondary="Nhắc nhở cho các hoạt động cá nhân"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.reminders}
                    onChange={(e) => handlePreferenceChange('reminders', e.target.checked)}
                    disabled={!preferences.enabled}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Favorite />
                </ListItemIcon>
                <ListItemText
                  primary="Nhắc nhở cặp đôi"
                  secondary="Nhắc nhở dành cho cả hai người trong mối quan hệ"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.coupleReminders}
                    onChange={(e) => handlePreferenceChange('coupleReminders', e.target.checked)}
                    disabled={!preferences.enabled}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Favorite sx={{ color: 'pink.500' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Tin nhắn tình yêu"
                  secondary="Những lời nhắn ngọt ngào và lãng mạn"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.loveMessages}
                    onChange={(e) => handlePreferenceChange('loveMessages', e.target.checked)}
                    disabled={!preferences.enabled}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <EmojiEvents />
                </ListItemIcon>
                <ListItemText
                  primary="Cột mốc ngày bình yên"
                  secondary="Chúc mừng những cột mốc đặc biệt trong hành trình yêu"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.peacefulDaysMilestones}
                    onChange={(e) => handlePreferenceChange('peacefulDaysMilestones', e.target.checked)}
                    disabled={!preferences.enabled}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>
        </Collapse>
      </Paper>

      {/* Advanced Settings */}
      <Paper sx={{ mb: 3 }}>
        <Box
          sx={{ p: 3, cursor: 'pointer' }}
          onClick={() => toggleSection('advanced')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Cài đặt nâng cao</Typography>
            {expandedSections.advanced ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </Box>
        
        <Collapse in={expandedSections.advanced}>
          <Box sx={{ px: 3, pb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.quietHours?.enabled || false}
                  onChange={(e) => handlePreferenceChange('quietHours.enabled', e.target.checked)}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule />
                  <Typography>Giờ yên tĩnh</Typography>
                </Box>
              }
              sx={{ mb: 2 }}
            />

            {preferences.quietHours?.enabled && (
              <Grid container spacing={2} sx={{ ml: 4 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Bắt đầu"
                    type="time"
                    value={preferences.quietHours?.start || '22:00'}
                    onChange={(e) => handlePreferenceChange('quietHours.start', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Kết thúc"
                    type="time"
                    value={preferences.quietHours?.end || '08:00'}
                    onChange={(e) => handlePreferenceChange('quietHours.end', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Testing Section */}
      <Paper sx={{ mb: 3 }}>
        <Box
          sx={{ p: 3, cursor: 'pointer' }}
          onClick={() => toggleSection('testing')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Kiểm tra thông báo</Typography>
            {expandedSections.testing ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </Box>
        
        <Collapse in={expandedSections.testing}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Kiểm tra xem thông báo có hoạt động đúng không
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleTest('local')}
                  disabled={permission !== 'granted' || testingStatus.local === 'testing'}
                  startIcon={getStatusIcon(testingStatus.local) || <Science />}
                >
                  Kiểm tra cơ bản
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleTest('fcm')}
                  disabled={!isFCMAvailable || testingStatus.fcm === 'testing'}
                  startIcon={getStatusIcon(testingStatus.fcm) || <Science />}
                >
                  Kiểm tra FCM
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleTest('comprehensive')}
                  disabled={permission !== 'granted' || testingStatus.comprehensive === 'testing'}
                  startIcon={getStatusIcon(testingStatus.comprehensive) || <Science />}
                >
                  Kiểm tra toàn diện
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="text"
                onClick={handleShowSystemStatus}
                startIcon={<Info />}
              >
                Xem trạng thái hệ thống
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSavePreferences}
          disabled={savingPreferences}
          sx={{ minWidth: 200 }}
        >
          {savingPreferences ? (
            <>
              <LinearProgress sx={{ mr: 2, width: 100 }} />
              Đang lưu...
            </>
          ) : (
            'Lưu cài đặt'
          )}
        </Button>
      </Box>

      {/* System Status Dialog */}
      <Dialog
        open={showTestDialog}
        onClose={() => setShowTestDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Trạng thái hệ thống thông báo</DialogTitle>
        <DialogContent>
          {systemStatus && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin chi tiết
              </Typography>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 8, 
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(systemStatus, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestDialog(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationSettings;