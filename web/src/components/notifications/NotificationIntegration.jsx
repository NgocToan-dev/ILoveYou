import { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import webNotificationsService from '../../services/webNotifications';

const NotificationIntegration = () => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Set callback để khi có notification mới sẽ được lưu vào context
    webNotificationsService.setNotificationCallback(addNotification);

    // Cleanup
    return () => {
      webNotificationsService.setNotificationCallback(null);
    };
  }, [addNotification]);

  // Component này không render gì, chỉ để kết nối service với context
  return null;
};

export default NotificationIntegration; 