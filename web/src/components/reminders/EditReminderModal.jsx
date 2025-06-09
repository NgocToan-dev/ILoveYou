import React, { useState, useEffect } from 'react';
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
  IconButton,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import {
  Close,
  Person,
  Favorite,
  Edit as EditIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { 
  updateReminder, 
  REMINDER_TYPES,
  REMINDER_CATEGORIES,
  REMINDER_PRIORITIES,
  RECURRING_TYPES,
  getCategoryDisplayInfo,
  getPriorityDisplayInfo,
  getRecurringDisplayInfo
} from '../../../../shared/services/firebase/reminders';

const EditReminderModal = ({ open, onClose, reminder }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: REMINDER_CATEGORIES.SPECIAL_OCCASIONS,
    priority: REMINDER_PRIORITIES.MEDIUM,
    dueDate: new Date(),
    recurring: RECURRING_TYPES.NONE
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when reminder changes
  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title || '',
        description: reminder.description || '',
        category: reminder.category || REMINDER_CATEGORIES.SPECIAL_OCCASIONS,
        priority: reminder.priority || REMINDER_PRIORITIES.MEDIUM,
        dueDate: reminder.dueDate?.toDate ? reminder.dueDate.toDate() : new Date(reminder.dueDate),
        recurring: reminder.recurring || RECURRING_TYPES.NONE
      });
    }
  }, [reminder]);

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

    if (!reminder?.id) {
      setError('Không tìm thấy thông tin nhắc nhở');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        dueDate: formData.dueDate,
        recurring: formData.recurring,
      };

      await updateReminder(reminder.id, updateData);
      handleClose();
    } catch (error) {
      console.error('Error updating reminder:', error);
      setError('Đã xảy ra lỗi khi cập nhật nhắc nhở');
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
      dueDate: new Date(),
      recurring: RECURRING_TYPES.NONE
    });
    setError('');
    onClose();
  };

  const isFormValid = formData.title.trim() && formData.dueDate;
  const hasChanges = reminder && (
    formData.title !== reminder.title ||
    formData.description !== (reminder.description || '') ||
    formData.category !== reminder.category ||
    formData.priority !== reminder.priority ||
    formData.dueDate?.getTime() !== (reminder.dueDate?.toDate ? reminder.dueDate.toDate().getTime() : new Date(reminder.dueDate).getTime()) ||
    formData.recurring !== (reminder.recurring || RECURRING_TYPES.NONE)
  );

  if (!reminder) return null;

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
            <EditIcon color="primary" />
            <Typography variant="h6" component="h2">
              Chỉnh sửa nhắc nhở
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
            {/* Reminder Type Display (Read-only) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Loại nhắc nhở
              </Typography>
              <Box sx={{ 
                p: 1.5, 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: theme.palette.grey[50]
              }}>
                {reminder.type === REMINDER_TYPES.PERSONAL ? (
                  <>
                    <Person sx={{ fontSize: 16, color: 'info.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      Cá nhân (không thể thay đổi)
                    </Typography>
                  </>
                ) : (
                  <>
                    <Favorite sx={{ fontSize: 16, color: 'error.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      Cặp đôi (không thể thay đổi)
                    </Typography>
                  </>
                )}
              </Box>
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
              label="Mô tả"
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

            {/* Status Info */}
            <Box sx={{ 
              p: 2, 
              border: `1px solid ${theme.palette.divider}`, 
              borderRadius: 1,
              backgroundColor: theme.palette.grey[50]
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Thông tin trạng thái
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trạng thái: {reminder.completed ? 'Đã hoàn thành' : 'Đang chờ'}
              </Typography>
              {reminder.createdAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Tạo lúc: {new Date(reminder.createdAt.toDate ? reminder.createdAt.toDate() : reminder.createdAt).toLocaleString('vi-VN')}
                </Typography>
              )}
              {reminder.updatedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Cập nhật lần cuối: {new Date(reminder.updatedAt.toDate ? reminder.updatedAt.toDate() : reminder.updatedAt).toLocaleString('vi-VN')}
                </Typography>
              )}
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
            disabled={!isFormValid || !hasChanges || loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditReminderModal;