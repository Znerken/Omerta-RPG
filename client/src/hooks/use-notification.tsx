import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { toast, useToast } from "@/hooks/use-toast";
import { Check, Ban, AlertCircle, DollarSign, Bell, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Notification, NotificationType } from "@/types";
import { queryClient } from "@/lib/queryClient";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  addNotification: (titleOrNotification: string | Partial<Notification>, message?: string, type?: NotificationType, data?: any) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true); // Default to enabled
  const { toast } = useToast();
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Load user preference from localStorage on mount
  useEffect(() => {
    const storedPreference = localStorage.getItem('notificationsEnabled');
    if (storedPreference !== null) {
      setNotificationsEnabled(storedPreference === 'true');
    }
  }, []);

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
    
    // Create WebSocket connection with user ID for authentication
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connected");
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
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
        
        // Handle friend request accepted notifications
        else if (data.type === "friend_accepted") {
          addNotification(
            "Friend Request Accepted", 
            `${data.username} accepted your friend request`, 
            "friend_accepted",
            {
              userId: data.userId,
              username: data.username,
              avatar: data.avatar
            }
          );
          
          // Invalidate friends list query to refresh UI
          queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
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
          
          // Invalidate friends list query to refresh UI with new status
          queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
        }
        
        // Handle friend removed notifications
        else if (data.type === "friend_removed") {
          addNotification(
            "Friend Removed", 
            `${data.username} has removed you from their friends list`, 
            "friend_removed",
            {
              userId: data.userId,
              username: data.username,
              avatar: data.avatar
            }
          );
          
          // Invalidate friends list query to refresh UI
          queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
        }
        
        // Handle unread messages count updates
        else if (data.type === "unreadMessages") {
          // Handled elsewhere, no notification needed
        }
        
        // Handle new message notifications
        else if (data.type === "new_message") {
          addNotification(
            "New Message", 
            `${data.senderName}: ${data.preview}`, 
            "message",
            {
              messageId: data.messageId,
              senderId: data.senderId,
              senderName: data.senderName,
              timestamp: data.timestamp
            }
          );
          
          // Invalidate unread messages count
          queryClient.invalidateQueries({ queryKey: ["/api/messages/unread"] });
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
    
    // Only show toast notification if notifications are enabled
    if (notificationsEnabled) {
      toast({
        title: newNotification.title,
        description: newNotification.message,
        variant: newNotification.type === "error" ? "destructive" : "default"
      });
    }
    
    // Different icons based on notification type
    // (We don't use this in the toast due to type constraints,
    // but we use it in the notification list component)
    
    return newNotification.id;
  }, [toast, notificationsEnabled]);

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
  
  const toggleNotifications = useCallback(() => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', newValue.toString());
    
    // Inform the user about the change
    toast({
      title: newValue ? "Notifications Enabled" : "Notifications Disabled",
      description: newValue 
        ? "You will now receive notifications" 
        : "You will no longer receive notifications",
      variant: "default"
    });
  }, [notificationsEnabled, toast]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        notificationsEnabled,
        toggleNotifications,
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