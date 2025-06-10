import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationTestPanel from '../components/notifications/NotificationTestPanel';
import NotificationBell from '../components/notifications/NotificationBell';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import webNotificationsService from '../services/webNotifications';

const NotificationDemo = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state for creating test reminder
  const [reminderForm, setReminderForm] = useState({
    title: 'Test Reminder',
    description: 'Đây là reminder test để kiểm tra notification system',
    priority: 'medium',
    dueDate: new Date(Date.now() + 60000), // 1 minute from now
    type: 'personal'
  });

  const handleCreateTestReminder = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const reminderData = {
        ...reminderForm,
        userId: user.uid,
        coupleId: user.coupleId || null,
        partnerId: reminderForm.type === 'couple' ? 'partner-id' : null,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'reminders'), reminderData);
      setMessage('✅ Test reminder đã được tạo! Kiểm tra notification bell để xem thông báo.');
      
      // Reset form
      setReminderForm(prev => ({
        ...prev,
        title: 'Test Reminder ' + Date.now(),
        dueDate: new Date(Date.now() + 60000)
      }));

    } catch (error) {
      console.error('Error creating test reminder:', error);
      setMessage('❌ Lỗi khi tạo test reminder: ' + error.message);
    }
    setLoading(false);
  };

  const handleDirectNotificationTest = async () => {
    setLoading(true);
    try {
      const testReminder = {
        id: 'direct-test-' + Date.now(),
        title: 'Direct Notification Test',
        description: 'Test notification trực tiếp từ service',
        priority: 'high',
        dueDate: new Date(),
        userId: user?.uid || 'test-user'
      };

      const result = await webNotificationsService.showReminderNotification(testReminder);
      setMessage(result.success ? 
        '✅ Direct notification test thành công!' : 
        '❌ Direct notification test thất bại: ' + result.error
      );
    } catch (error) {
      setMessage('❌ Lỗi direct notification: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Notification System Demo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Test và demo hệ thống thông báo hoàn chỉnh
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={`${unreadCount} chưa đọc`} 
            color={unreadCount > 0 ? 'error' : 'default'}
            variant="outlined"
          />
          <NotificationBell />
        </Box>
      </Box>

      {/* Status Message */}
      {message && (
        <Alert 
          severity={message.includes('✅') ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Test Panel */}
        <Grid item xs={12}>
          <NotificationTestPanel />
        </Grid>

        {/* Create Test Reminder */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon color="primary" />
              Tạo Test Reminder
            </Typography>
            
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={reminderForm.title}
                onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={2}
                value={reminderForm.description}
                onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Độ ưu tiên</InputLabel>
                    <Select
                      value={reminderForm.priority}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <MenuItem value="low">Thấp</MenuItem>
                      <MenuItem value="medium">Trung bình</MenuItem>
                      <MenuItem value="high">Cao</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Loại</InputLabel>
                    <Select
                      value={reminderForm.type}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <MenuItem value="personal">Cá nhân</MenuItem>
                      <MenuItem value="couple">Couple</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <DateTimePicker
                label="Thời gian nhắc nhở"
                value={reminderForm.dueDate}
                onChange={(newValue) => setReminderForm(prev => ({ ...prev, dueDate: newValue }))}
                sx={{ width: '100%', mb: 3 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<ScheduleIcon />}
                onClick={handleCreateTestReminder}
                disabled={loading}
              >
                Tạo Test Reminder
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SendIcon color="primary" />
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={handleDirectNotificationTest}
                disabled={loading}
              >
                Test Direct Notification
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/notifications'}
              >
                Mở Notification Settings
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/reminders'}
              >
                Xem Danh Sách Reminders
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Notifications ({notifications.length})
            </Typography>
            
            {notifications.length === 0 ? (
              <Alert severity="info">
                Chưa có notification nào. Hãy tạo test reminder để xem notification hoạt động!
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {notifications.slice(0, 10).map((notification) => (
                  <Card key={notification.id} sx={{ mb: 2 }} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {notification.body}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {notification.createdAt?.toLocaleString('vi-VN')}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={notification.type} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          {!notification.read && (
                            <Chip 
                              label="Mới" 
                              size="small" 
                              color="error" 
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NotificationDemo; 