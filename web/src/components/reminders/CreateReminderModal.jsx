import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import {
  Close,
  Person,
  Favorite,
  Notifications as NotificationsIcon,
  DateRange,
  Schedule
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { 
  createReminder, 
  REMINDER_TYPES,
  REMINDER_CATEGORIES,
  REMINDER_PRIORITIES,
  RECURRING_TYPES,
  getCategoryDisplayInfo,
  getPriorityDisplayInfo,
  getRecurringDisplayInfo
} from '../../../../shared/services/firebase/reminders';

const CreateReminderModal = ({ open, onClose, userId, coupleId, defaultType = REMINDER_TYPES.PERSONAL }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: REMINDER_CATEGORIES.SPECIAL_OCCASIONS,
    priority: REMINDER_PRIORITIES.MEDIUM,
    type: defaultType,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    recurring: RECURRING_TYPES.NONE
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề nhắc nhở');
      return;
    }

    if (!formData.dueDate) {
      setError('Vui lòng chọn thời gian nhắc nhở');
      return;
    }

    if (formData.type === REMINDER_TYPES.COUPLE && !coupleId) {
      setError('Bạn cần kết nối với người yêu để tạo nhắc nhở cặp đôi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reminderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        type: formData.type,
        dueDate: formData.dueDate,
        recurring: formData.recurring,
        userId: userId,
      };

      if (formData.type === REMINDER_TYPES.COUPLE) {
        reminderData.coupleId = coupleId;
      }

      const result = await createReminder(reminderData);
      
      if (result.success) {
        handleClose();
      } else {
        setError(result.error || 'Không thể tạo nhắc nhở');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      setError('Đã xảy ra lỗi khi tạo nhắc nhở');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: REMINDER_CATEGORIES.SPECIAL_OCCASIONS,
      priority: REMINDER_PRIORITIES.MEDIUM,
      type: defaultType,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      recurring: RECURRING_TYPES.NONE
    });
    setError('');
    onClose();
  };

  const isFormValid = formData.title.trim() && formData.dueDate;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: isMobile ? '100vh' : '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6" component="h2">
              Tạo nhắc nhở mới
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Reminder Type Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Loại nhắc nhở
              </Typography>
              <ToggleButtonGroup
                value={formData.type}
                exclusive
                onChange={(e, newType) => newType && handleInputChange('type', newType)}
                fullWidth={isMobile}
                size="small"
              >
                <ToggleButton value={REMINDER_TYPES.PERSONAL}>
                  <Person sx={{ mr: 1, fontSize: 16 }} />
                  Cá nhân
                </ToggleButton>
                {coupleId && (
                  <ToggleButton value={REMINDER_TYPES.COUPLE}>
                    <Favorite sx={{ mr: 1, fontSize: 16 }} />
                    Cặp đôi
                  </ToggleButton>
                )}
              </ToggleButtonGroup>
              {!coupleId && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Kết nối với người yêu để có thể tạo nhắc nhở cặp đôi
                </Typography>
              )}
            </Box>

            {/* Title */}
            <TextField
              fullWidth
              label="Tiêu đề"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Nhập tiêu đề nhắc nhở..."
              variant="outlined"
              required
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Mô tả (không bắt buộc)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Thêm mô tả chi tiết..."
              multiline
              rows={3}
              variant="outlined"
            />

            <Grid container spacing={2}>
              {/* Category */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={formData.category}
                    label="Danh mục"
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    {Object.values(REMINDER_CATEGORIES).map((category) => {
                      const info = getCategoryDisplayInfo(category);
                      return (
                        <MenuItem key={category} value={category}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography component="span">{info.emoji}</Typography>
                            <Typography>{info.name}</Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priority */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Độ ưu tiên</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Độ ưu tiên"
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    {Object.values(REMINDER_PRIORITIES).map((priority) => {
                      const info = getPriorityDisplayInfo(priority);
                      return (
                        <MenuItem key={priority} value={priority}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography component="span">{info.emoji}</Typography>
                            <Typography>{info.name}</Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              {/* Due Date */}
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Thời gian nhắc nhở"
                  value={formData.dueDate}
                  onChange={(newValue) => handleInputChange('dueDate', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: 'outlined'
                    }
                  }}
                  minDateTime={new Date()}
                />
              </Grid>

              {/* Recurring */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Lặp lại</InputLabel>
                  <Select
                    value={formData.recurring}
                    label="Lặp lại"
                    onChange={(e) => handleInputChange('recurring', e.target.value)}
                  >
                    {Object.values(RECURRING_TYPES).map((recurring) => {
                      const info = getRecurringDisplayInfo(recurring);
                      return (
                        <MenuItem key={recurring} value={recurring}>
                          {info.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Preview */}
            <Box sx={{ 
              p: 2, 
              border: `1px solid ${theme.palette.divider}`, 
              borderRadius: 1,
              backgroundColor: theme.palette.grey[50]
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Xem trước
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>{formData.title || 'Tiêu đề nhắc nhở'}</strong>
              </Typography>
              {formData.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {formData.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {formData.dueDate?.toLocaleString('vi-VN')} • {getCategoryDisplayInfo(formData.category).name} • {getPriorityDisplayInfo(formData.priority).name}
                {formData.recurring !== RECURRING_TYPES.NONE && ` • ${getRecurringDisplayInfo(formData.recurring).name}`}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid || loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Đang tạo...' : 'Tạo nhắc nhở'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateReminderModal;