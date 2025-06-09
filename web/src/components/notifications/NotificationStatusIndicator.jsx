import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Badge
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  NotificationsPaused,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationStatusIndicator = ({ 
  variant = 'chip', // 'chip', 'icon', 'badge'
  size = 'medium',
  showLabel = true,
  onClick = null
}) => {
  const {
    permission,
    supported,
    fcmSupported,
    isAvailable,
    isFCMAvailable,
    loading,
    error
  } = useNotifications();

  // Determine status
  const getStatus = () => {
    if (!supported) {
      return {
        status: 'unsupported',
        label: 'Không hỗ trợ',
        icon: <NotificationsOff />,
        color: 'default',
        tooltip: 'Trình duyệt không hỗ trợ thông báo'
      };
    }

    if (error) {
      return {
        status: 'error',
        label: 'Lỗi',
        icon: <Error />,
        color: 'error',
        tooltip: `Lỗi thông báo: ${error}`
      };
    }

    if (loading) {
      return {
        status: 'loading',
        label: 'Đang tải...',
        icon: <NotificationsPaused />,
        color: 'default',
        tooltip: 'Đang kiểm tra trạng thái thông báo'
      };
    }

    if (permission === 'denied') {
      return {
        status: 'denied',
        label: 'Bị từ chối',
        icon: <NotificationsOff />,
        color: 'error',
        tooltip: 'Thông báo đã bị từ chối. Vui lòng bật trong cài đặt trình duyệt'
      };
    }

    if (permission === 'default') {
      return {
        status: 'default',
        label: 'Chưa bật',
        icon: <NotificationsPaused />,
        color: 'warning',
        tooltip: 'Thông báo chưa được bật'
      };
    }

    if (permission === 'granted') {
      if (isFCMAvailable) {
        return {
          status: 'fcm-active',
          label: 'Hoạt động tốt',
          icon: <CheckCircle />,
          color: 'success',
          tooltip: 'Thông báo đang hoạt động bình thường với FCM'
        };
      } else if (isAvailable) {
        return {
          status: 'basic-active',
          label: 'Cơ bản',
          icon: <Notifications />,
          color: 'primary',
          tooltip: 'Thông báo cơ bản đang hoạt động'
        };
      } else {
        return {
          status: 'granted-inactive',
          label: 'Chưa sẵn sàng',
          icon: <Warning />,
          color: 'warning',
          tooltip: 'Thông báo đã được cấp phép nhưng chưa sẵn sàng'
        };
      }
    }

    return {
      status: 'unknown',
      label: 'Không xác định',
      icon: <Warning />,
      color: 'default',
      tooltip: 'Trạng thái thông báo không xác định'
    };
  };

  const statusInfo = getStatus();

  // Badge variant - shows notification count or status
  if (variant === 'badge') {
    const getBadgeContent = () => {
      switch (statusInfo.status) {
        case 'fcm-active':
          return 0; // No badge when working
        case 'basic-active':
          return '!';
        case 'denied':
        case 'error':
          return '!';
        case 'default':
          return '?';
        default:
          return '!';
      }
    };

    const getBadgeColor = () => {
      switch (statusInfo.status) {
        case 'fcm-active':
          return 'success';
        case 'basic-active':
          return 'primary';
        case 'denied':
        case 'error':
          return 'error';
        case 'default':
          return 'warning';
        default:
          return 'default';
      }
    };

    return (
      <Tooltip title={statusInfo.tooltip} arrow>
        <Badge
          badgeContent={getBadgeContent()}
          color={getBadgeColor()}
          invisible={statusInfo.status === 'fcm-active'}
          sx={{ cursor: onClick ? 'pointer' : 'default' }}
          onClick={onClick}
        >
          <Notifications color={statusInfo.color} />
        </Badge>
      </Tooltip>
    );
  }

  // Icon variant - just the icon
  if (variant === 'icon') {
    const IconComponent = onClick ? IconButton : Box;
    const iconProps = onClick ? { onClick } : {};

    return (
      <Tooltip title={statusInfo.tooltip} arrow>
        <IconComponent {...iconProps}>
          {React.cloneElement(statusInfo.icon, {
            color: statusInfo.color,
            fontSize: size
          })}
        </IconComponent>
      </Tooltip>
    );
  }

  // Chip variant (default) - shows status as chip
  return (
    <Tooltip title={statusInfo.tooltip} arrow>
      <Chip
        icon={statusInfo.icon}
        label={showLabel ? statusInfo.label : ''}
        color={statusInfo.color}
        size={size}
        variant={statusInfo.status === 'fcm-active' ? 'filled' : 'outlined'}
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          ...(onClick && {
            '&:hover': {
              backgroundColor: `${statusInfo.color}.light`
            }
          })
        }}
      />
    </Tooltip>
  );
};

export default NotificationStatusIndicator;