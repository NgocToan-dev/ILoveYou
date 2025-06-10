import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Science as TestIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import webNotificationsService from '../../services/webNotifications';

const NotificationTestPanel = () => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const testLocalNotification = async () => {
    setLoading(true);
    try {
      const result = await webNotificationsService.testNotification();
      addResult(
        result.success ? 'Local notification test thành công!' : `Local notification test thất bại: ${result.error}`,
        result.success ? 'success' : 'error'
      );
    } catch (error) {
      addResult(`Lỗi local notification: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const testContextNotification = async () => {
    setLoading(true);
    try {
      await addNotification({
        title: 'Test Context Notification',
        body: 'Đây là thông báo test từ Notification Context',
        type: 'reminder',
        data: { test: true },
        actionUrl: '/reminders'
      });
      addResult('Context notification test thành công!', 'success');
    } catch (error) {
      addResult(`Lỗi context notification: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const testFCMNotification = async () => {
    setLoading(true);
    try {
      const result = await webNotificationsService.testFCMNotification();
      addResult(
        result.success ? 'FCM notification test thành công!' : `FCM notification test thất bại: ${result.error}`,
        result.success ? 'success' : 'error'
      );
    } catch (error) {
      addResult(`Lỗi FCM notification: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const testReminderNotification = async () => {
    setLoading(true);
    try {
      const testReminder = {
        id: 'test-reminder-' + Date.now(),
        title: 'Test Reminder Notification',
        description: 'Đây là reminder test với đầy đủ tính năng',
        priority: 'high',
        dueDate: new Date(),
        userId: 'test-user',
        coupleId: 'test-couple'
      };

      const result = await webNotificationsService.showReminderNotification(testReminder);
      addResult(
        result.success ? 'Reminder notification test thành công!' : `Reminder notification test thất bại: ${result.error}`,
        result.success ? 'success' : 'error'
      );
    } catch (error) {
      addResult(`Lỗi reminder notification: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const testComprehensive = async () => {
    setLoading(true);
    try {
      const result = await webNotificationsService.comprehensiveTest();
      addResult(
        `Comprehensive test: ${result.overall ? 'Thành công' : 'Thất bại'}`,
        result.overall ? 'success' : 'error'
      );
      
      if (result.localNotification) {
        addResult(
          `- Local: ${result.localNotification.success ? 'OK' : result.localNotification.error}`,
          result.localNotification.success ? 'success' : 'error'
        );
      }
      
      if (result.fcmNotification) {
        addResult(
          `- FCM: ${result.fcmNotification.success ? 'OK' : result.fcmNotification.error}`,
          result.fcmNotification.success ? 'success' : 'error'
        );
      }
    } catch (error) {
      addResult(`Lỗi comprehensive test: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TestIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight="bold">
          Notification Test Panel
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<NotificationsIcon />}
            onClick={testLocalNotification}
            disabled={loading}
          >
            Test Local
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={testContextNotification}
            disabled={loading}
          >
            Test Context
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={testFCMNotification}
            disabled={loading}
          >
            Test FCM
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={testReminderNotification}
            disabled={loading}
          >
            Test Reminder
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<TestIcon />}
            onClick={testComprehensive}
            disabled={loading}
          >
            Comprehensive Test
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={clearResults}
            disabled={loading}
          >
            Clear Results
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {results.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Test Results:
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {results.map((result, index) => (
              <Alert
                key={index}
                severity={result.type}
                sx={{ mb: 1 }}
                variant="outlined"
              >
                <Typography variant="body2">
                  {result.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {result.timestamp.toLocaleTimeString()}
                </Typography>
              </Alert>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default NotificationTestPanel; 