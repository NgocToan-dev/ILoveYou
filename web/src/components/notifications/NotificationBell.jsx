import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
  DeleteSweep as DeleteSweepIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const NotificationBell = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reminder':
        return <ScheduleIcon fontSize="small" color="primary" />;
      case 'event':
        return <EventIcon fontSize="small" color="secondary" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: i18n.language === 'vi' ? vi : enUS
    });
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Thông báo">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            position: 'relative',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? (
              <NotificationsIcon />
            ) : (
              <NotificationsNoneIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: isMobile ? '90vw' : 400,
            maxWidth: '100vw',
            maxHeight: '70vh',
            mt: 1
          }
        }}
      >
        <Paper>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Thông báo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'inherit'
                  }}
                />
              )}
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Actions */}
          {notifications.length > 0 && (
            <Box sx={{ p: 1, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    startIcon={<DoneAllIcon />}
                    onClick={markAllAsRead}
                    variant="outlined"
                  >
                    Đánh dấu đã đọc
                  </Button>
                )}
                <Button
                  size="small"
                  startIcon={<DeleteSweepIcon />}
                  onClick={clearAllNotifications}
                  color="error"
                  variant="outlined"
                >
                  Xóa tất cả
                </Button>
              </Box>
            </Box>
          )}

          <Divider />

          {/* Content */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Đang tải...
                </Typography>
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsNoneIcon
                  sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Không có thông báo nào
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      button
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        bgcolor: notification.read
                          ? 'transparent'
                          : 'action.hover',
                        '&:hover': {
                          bgcolor: 'action.selected'
                        },
                        alignItems: 'flex-start',
                        py: 2
                      }}
                    >
                      <Box sx={{ mr: 2, mt: 0.5 }}>
                        {getNotificationIcon(notification.type)}
                      </Box>

                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            fontWeight={notification.read ? 'normal' : 'bold'}
                            sx={{ mb: 0.5 }}
                          >
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}
                            >
                              {notification.body}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {getTimeAgo(notification.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(event) =>
                            handleDeleteNotification(notification.id, event)
                          }
                          sx={{ opacity: 0.7 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationBell; 