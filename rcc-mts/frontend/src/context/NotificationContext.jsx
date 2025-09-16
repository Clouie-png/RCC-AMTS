import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (user?.id && user?.token) {
      try {
        const response = await axios.get(`${API_BASE_URL}/notifications/user/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Optional: Set up polling to fetch notifications periodically
    const interval = setInterval(fetchNotifications, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [user?.token]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map(n => 
          axios.put(`${API_BASE_URL}/notifications/${n.id}/read`, {}, {
            headers: { Authorization: `Bearer ${user.token}` },
          })
        )
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, is_read: 1 }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications, user?.token]);

  return (
    <NotificationContext.Provider value={{ notifications, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

