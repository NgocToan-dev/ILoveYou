import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Alert,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { Notifications, NotificationsPaused } from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    notifyOnSnooze: true,
    language: 'vi'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { 
    getPreferences, 
    updatePreferences, 
    toggleSnoozeNotification,
    isAvailable,
    isFCMAvailable 
  } = useNotifications();

  // Load current preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const result = await getPreferences();
        
        if (result.success && result.preferences) {
          setPreferences(prev => ({
            ...prev,
            ...result.preferences
          }));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setMessage({
          type: 'error',
          text: 'Không thể tải cài đặt thông báo'
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [getPreferences]);

  const handleToggleSnoozeNotification = async (event) => {
    const enabled = event.target.checked;
    
    try {
      setSaving(true);
      const result = await toggleSnoozeNotification(enabled);
      
      if (result.success) {
        setPreferences(prev => ({
          ...prev,
          notifyOnSnooze: enabled
        }));
        
        setMessage({
          type: 'success',
          text: enabled 
            ? 'Đã bật thông báo khi hoãn nhắc nhở' 
            : 'Đã tắt thông báo khi hoãn nhắc nhở'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Không thể cập nhật cài đặt'
        });
      }
    } catch (error) {
      console.error('Error updating snooze notification:', error);
      setMessage({
        type: 'error',
        text: 'Có lỗi xảy ra khi cập nhật cài đặt'
      });
    } finally {
      setSaving(false);
    }
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Notifications sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Cài đặt thông báo
            </Typography>
          </Box>

          {message.text && (
            <Alert 
              severity={message.type} 
              onClose={clearMessage}
              sx={{ mb: 2 }}
            >
              {message.text}
            </Alert>
          )}

          {!isAvailable && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Thông báo trình duyệt chưa được bật. Một số tính năng có thể không hoạt động.
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cấu hình các loại thông báo bạn muốn nhận
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notifyOnSnooze}
                  onChange={handleToggleSnoozeNotification}
                  disabled={saving}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">
                    Thông báo khi hoãn nhắc nhở
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nhận thông báo xác nhận khi hoãn một nhắc nhở
                  </Typography>
                </Box>
              }
              sx={{ 
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': {
                  ml: 1
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Trạng thái thông báo:
            </Typography>
            {isAvailable ? (
              <>
                <Notifications sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2" color="success.main">
                  Đã bật
                </Typography>
              </>
            ) : (
              <>
                <NotificationsPaused sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="body2" color="warning.main">
                  Chưa bật
                </Typography>
              </>
            )}
          </Box>

          {isFCMAvailable && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              ✓ Thông báo đẩy đã sã
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationSettings; 