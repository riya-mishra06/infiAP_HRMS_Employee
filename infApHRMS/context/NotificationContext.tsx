import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ADMIN_API_URL } from '../constants/api';

export type NotificationType = 'leave' | 'attendance' | 'payroll' | 'performance' | 'system';

export interface NotificationAttachment {
  name: string;
  size: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  description: string;
  time: string;
  timestamp: string;
  isRead: boolean;
  sender: string;
  division: string;
  isOnline: boolean;
  highlights?: string[];
  attachment?: NotificationAttachment;
  route?: string;
}

type NotificationApiRecord = {
  id?: string;
  _id?: string;
  category?: string;
  headline?: string;
  title?: string;
  details?: string;
  scheduleAt?: string;
  createdAt?: string;
  sentBy?: string;
};

type NotificationsApiResponse = {
  status?: string;
  data?: NotificationApiRecord[];
};

interface NotificationContextType {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getNotificationById: (id: string) => Notification | undefined;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getNotificationType = (category?: string): NotificationType => {
  const normalized = (category || '').toLowerCase();
  if (normalized.includes('leave')) return 'leave';
  if (normalized.includes('attendance')) return 'attendance';
  if (normalized.includes('payroll')) return 'payroll';
  if (normalized.includes('performance')) return 'performance';
  return 'system';
};

const getNotificationRoute = (type: NotificationType) => {
  if (type === 'leave') return '/(employee)/leave';
  if (type === 'attendance') return '/(employee)/attendance';
  if (type === 'payroll') return '/(employee)/payroll';
  if (type === 'performance') return '/(employee)/performance';
  return undefined;
};

const mapNotification = (record: NotificationApiRecord, index: number): Notification => {
  const type = getNotificationType(record.category);
  return {
    id: record.id || record._id || `notification-${index + 1}`,
    type,
    title: record.headline || record.title || 'Notification',
    message: (record.details || '').slice(0, 120),
    description: record.details || '',
    time: record.scheduleAt ? new Date(record.scheduleAt).toLocaleString() : 'Just now',
    timestamp: record.createdAt || new Date().toISOString(),
    isRead: false,
    sender: record.sentBy || 'System',
    division: 'General',
    isOnline: true,
    route: getNotificationRoute(type),
  };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${ADMIN_API_URL}/notifications`);
      const json = (await response.json()) as NotificationsApiResponse;

      if (!response.ok) {
        throw new Error('Unable to fetch notifications.');
      }

      const records = Array.isArray(json.data) ? json.data : [];
      setNotifications(records.map(mapNotification));
    } catch (fetchError) {
      setNotifications([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const getNotificationById = (id: string) => notifications.find((item) => item.id === id);

  const value = useMemo(
    () => ({
      notifications,
      isLoading,
      error,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      getNotificationById,
    }),
    [notifications, isLoading, error, refreshNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
