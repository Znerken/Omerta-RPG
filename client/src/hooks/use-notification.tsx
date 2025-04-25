import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { toast, useToast } from "@/hooks/use-toast";
import { Check, Ban, AlertCircle, DollarSign, Bell, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export type NotificationType = "success" | "error" | "warning" | "info" | "payment" | "friend_request" | "friend_status";

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
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!user) {
      // Close any existing connection if user is logged out
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }
    
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connected");
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle friend request notifications
        if (data.type === "friend_request") {
          addNotification(
            "Friend Request", 
            `${data.from.username} wants to be your friend`, 
            "friend_request",
            {
              requestId: data.requestId,
              userId: data.from.id,
              username: data.from.username,
              avatar: data.from.avatar
            }
          );
        }
        
        // Handle friend status updates
        else if (data.type === "friend_status") {
          addNotification(
            "Friend Status Update", 
            `${data.username} is now ${data.status}`, 
            "friend_status",
            {
              userId: data.userId,
              username: data.username,
              avatar: data.avatar,
              status: data.status
            }
          );
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [user]);

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