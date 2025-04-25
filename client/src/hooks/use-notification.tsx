import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast, useToast } from "@/hooks/use-toast";
import { Check, Ban, AlertCircle, DollarSign, Bell } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info" | "payment";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (titleOrNotification: string | Partial<Notification>, message?: string, type?: NotificationType, data?: any) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((
    titleOrNotification: string | Partial<Notification>, 
    message?: string, 
    type?: NotificationType, 
    data?: any
  ) => {
    let newNotification: Notification;
    
    // Check if the first argument is a string (title) or an object (partial notification)
    if (typeof titleOrNotification === 'string') {
      const id = Date.now().toString();
      newNotification = {
        id,
        title: titleOrNotification,
        message: message || '',
        type: type || 'info',
        timestamp: new Date(),
        read: false,
        data
      };
    } else {
      // It's a partial notification object
      const id = titleOrNotification.id || Date.now().toString();
      newNotification = {
        id,
        title: titleOrNotification.title || 'Notification',
        message: titleOrNotification.message || '',
        type: titleOrNotification.type || 'info',
        timestamp: titleOrNotification.timestamp || new Date(),
        read: titleOrNotification.read ?? false,
        data: titleOrNotification.data
      };
    }
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification
    toast({
      title: newNotification.title,
      description: newNotification.message,
      variant: newNotification.type === "error" ? "destructive" : "default"
    });
    
    // Different icons based on notification type
    // (We don't use this in the toast due to type constraints,
    // but we use it in the notification list component)
    
    return newNotification.id;
  }, [toast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        addNotification, 
        markAsRead, 
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};