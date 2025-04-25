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
  addNotification: (title: string, message: string, type: NotificationType, data?: any) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((title: string, message: string, type: NotificationType, data?: any) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      data
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification
    const toastIcons = {
      success: <Check className="h-4 w-4" />,
      error: <Ban className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      info: <Bell className="h-4 w-4" />,
      payment: <DollarSign className="h-4 w-4" />
    };
    
    toast({
      title: title,
      description: message,
      variant: type === "error" ? "destructive" : "default",
      icon: toastIcons[type]
    });
    
    return id;
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