import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
  AccessTime,
  Person,
  Favorite,
  Warning,
  Schedule,
  Snooze
} from '@mui/icons-material';
import {
  getCategoryDisplayInfo,
  getPriorityDisplayInfo,
  REMINDER_TYPES
} from '../../../../shared/constants/reminders';
import { formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import SnoozeDialog from './SnoozeDialog';
import { updateReminder } from '../../../../shared/services/firebase/reminders';

const ReminderCard = ({ reminder, onEdit, onDelete, onToggleComplete }) => {
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);

  const categoryInfo = getCategoryDisplayInfo(reminder.category);
  const priorityInfo = getPriorityDisplayInfo(reminder.priority);
  const isCouple = reminder.type === REMINDER_TYPES.COUPLE;
  
  const formatDate = (date) => {
    if (!date) return '';
    const reminderDate = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(reminderDate, { addSuffix: true, locale: vi });
  };

  const getDueDateStatus = () => {
    if (!reminder.dueDate) return null;
    
    const dueDate = reminder.dueDate.toDate ? reminder.dueDate.toDate() : new Date(reminder.dueDate);
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const nextWeek = addDays(now, 7);

    if (isBefore(dueDate, now) && !reminder.completed) {
      return { status: 'overdue', color: 'error', label: 'Quá hạn' };
    } else if (isBefore(dueDate, tomorrow) && !reminder.completed) {
      return { status: 'today', color: 'warning', label: 'Hôm nay' };
    } else if (isBefore(dueDate, nextWeek) && !reminder.completed) {
      return { status: 'soon', color: 'info', label: 'Sắp tới' };
    } else if (reminder.completed) {
      return { status: 'completed', color: 'success', label: 'Hoàn thành' };
    }
    
    return { status: 'future', color: 'default', label: 'Sắp tới' };
  };

  const dueDateStatus = getDueDateStatus();

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(reminder.id);
    setDeleteDialogOpen(false);
  };

  const handleToggleComplete = () => {
    onToggleComplete(reminder);
  };

  const handleSnooze = async (duration) => {
    try {
      // Calculate new due date
      const newDueDate = new Date(Date.now() + duration * 60 * 1000);
      
      // Update reminder
      await updateReminder(reminder.id, {
        dueDate: newDueDate,
        snoozeUntil: newDueDate,
        updatedAt: new Date()
      });
      
      console.log(`✅ Reminder snoozed for ${duration} minutes until ${newDueDate.toLocaleString('vi-VN')}`);
    } catch (error) {
      console.error('❌ Error snoozing reminder:', error);
      alert('Không thể hoãn nhắc nhở. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
          border: `1px solid ${priorityInfo.color}20`,
          borderLeft: `4px solid ${priorityInfo.color}`,
          opacity: reminder.completed ? 0.7 : 1,
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                  textDecoration: reminder.completed ? 'line-through' : 'none'
                }}
              >
                {reminder.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={categoryInfo.name}
                  size="small"
                  sx={{
                    backgroundColor: `${categoryInfo.color}15`,
                    color: categoryInfo.color,
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
                
                <Chip
                  label={priorityInfo.name}
                  size="small"
                  sx={{
                    backgroundColor: `${priorityInfo.color}15`,
                    color: priorityInfo.color,
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />

                <Tooltip title={isCouple ? 'Nhắc nhở cặp đôi' : 'Nhắc nhở cá nhân'}>
                  {isCouple ? (
                    <Favorite sx={{ fontSize: 14, color: 'error.main' }} />
                  ) : (
                    <Person sx={{ fontSize: 14, color: 'info.main' }} />
                  )}
                </Tooltip>
              </Box>
            </Box>

            <IconButton 
              size="small" 
              onClick={handleToggleComplete}
              sx={{ 
                color: reminder.completed ? 'success.main' : 'text.secondary',
                ml: 1
              }}
            >
              {reminder.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
            </IconButton>
          </Box>

          {/* Description */}
          {reminder.description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mb: 2,
                lineHeight: 1.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {reminder.description}
            </Typography>
          )}

          {/* Due Date */}
          {reminder.dueDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: dueDateStatus?.color + '.main' }} />
              <Typography variant="body2" color={dueDateStatus?.color + '.main'}>
                {new Date(reminder.dueDate.toDate ? reminder.dueDate.toDate() : reminder.dueDate).toLocaleDateString('vi-VN')}
              </Typography>
              {dueDateStatus && (
                <Chip
                  label={dueDateStatus.label}
                  size="small"
                  color={dueDateStatus.color}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}

          {/* Recurring Info */}
          {reminder.recurring && reminder.recurring !== 'none' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule sx={{ fontSize: 16, color: 'info.main' }} />
              <Typography variant="caption" color="info.main">
                Lặp lại hàng {reminder.recurring === 'daily' ? 'ngày' : 
                           reminder.recurring === 'weekly' ? 'tuần' : 
                           reminder.recurring === 'monthly' ? 'tháng' : 'năm'}
              </Typography>
            </Box>
          )}

          {/* Progress for overdue items */}
          {dueDateStatus?.status === 'overdue' && !reminder.completed && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                color="error"
                sx={{ height: 4, borderRadius: 2 }}
              />
              <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                Đã quá hạn {formatDate(reminder.dueDate)}
              </Typography>
            </Box>
          )}

          {/* Updated time */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Cập nhật {formatDate(reminder.updatedAt)}
          </Typography>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
          <Box>
            {dueDateStatus?.status === 'overdue' && !reminder.completed && (
              <Warning sx={{ fontSize: 16, color: 'error.main' }} />
            )}
          </Box>
          <Box>
            {/* Snooze button - only show for overdue or today reminders that are not completed */}
            {(dueDateStatus?.status === 'overdue' || dueDateStatus?.status === 'today') && !reminder.completed && (
              <Tooltip title="Hoãn nhắc nhở">
                <IconButton 
                  size="small" 
                  onClick={() => setSnoozeDialogOpen(true)}
                  sx={{ color: 'warning.main' }}
                >
                  <Snooze fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Chỉnh sửa">
              <IconButton 
                size="small" 
                onClick={() => onEdit(reminder)}
                sx={{ color: 'primary.main' }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa">
              <IconButton 
                size="small" 
                onClick={handleDeleteClick}
                sx={{ color: 'error.main' }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>

      {/* Snooze Dialog */}
      <SnoozeDialog
        open={snoozeDialogOpen}
        onClose={() => setSnoozeDialogOpen(false)}
        onSnooze={handleSnooze}
        reminderTitle={reminder.title}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa nhắc nhở</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa nhắc nhở "<strong>{reminder.title}</strong>" không? 
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReminderCard;