import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Listen to notifications from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        });
      });

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to notifications:', error);
      
      // Try simple query without orderBy if composite query fails
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        const simpleQ = query(notificationsRef, where('userId', '==', user.uid));
        
        const simpleUnsubscribe = onSnapshot(simpleQ, (snapshot) => {
          const notificationsList = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            notificationsList.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate()
            });
          });

          // Sort client-side since we can't use orderBy without index
          notificationsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          
          setNotifications(notificationsList);
          setUnreadCount(notificationsList.filter(n => !n.read).length);
          setLoading(false);
        });
        
        return simpleUnsubscribe;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Add new notification
  const addNotification = async (notificationData) => {
    if (!user?.uid) return;

    try {
      const notification = {
        userId: user.uid,
        title: notificationData.title,
        body: notificationData.body,
        type: notificationData.type || 'reminder',
        data: notificationData.data || {},
        read: false,
        createdAt: new Date(),
        actionUrl: notificationData.actionUrl || null
      };

      await addDoc(collection(db, 'notifications'), notification);

      // Show toast notification
      toast.info(notification.title, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const batch = [];
      notifications.filter(n => !n.read).forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.push(updateDoc(notificationRef, { read: true }));
      });
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const batch = [];
      notifications.forEach(notification => {
        batch.push(deleteDoc(doc(db, 'notifications', notification.id)));
      });
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const contextValue = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}; 