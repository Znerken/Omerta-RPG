import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { toast, useToast } from "@/hooks/use-toast";
import { Check, Ban, AlertCircle, DollarSign, Bell, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Notification, NotificationType } from "@/types";
import { queryClient } from "@/lib/queryClient";
import { useWebSocketContext } from "./use-websocket-context";

// Maximum number of notifications to store
const MAX_NOTIFICATIONS = 50;

// Storage key for notifications in localStorage
const STORAGE_KEY = 'omerta_notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  addNotification: (titleOrNotification: string | Partial<Notification>, message?: string, type?: NotificationType, data?: any) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper function to debounce function calls
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Helper function to check if two notifications are similar enough to be grouped
function areSimilarNotifications(n1: Notification, n2: Notification): boolean {
  // If they're from the same source/type and within 30 seconds of each other
  return n1.type === n2.type && 
         n1.title === n2.title &&
         Math.abs(n1.timestamp.getTime() - n2.timestamp.getTime()) < 30000;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true); // Default to enabled
  const { toast } = useToast();
  const { user } = useAuth();
  const { isConnected, addMessageHandler } = useWebSocketContext();
  const messageHandlerRef = useRef<(() => void) | null>(null);
  
  // Track which notification types have been shown recently (to prevent spam)
  const recentNotificationsRef = useRef<Record<string, number>>({});
  // Track notification handlers for cleanup
  const notificationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Define addNotification first before it's used in other callbacks
  const addNotification = useCallback((
    titleOrNotification: string | Partial<Notification>, 
    message?: string, 
    type?: NotificationType, 
    data?: any
  ): string => {
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
    
    // Check for similar recent notifications to prevent duplication
    setNotifications(prev => {
      // Try to find a similar notification that was received recently
      const similarNotification = prev.find(n => areSimilarNotifications(n, newNotification));
      
      if (similarNotification) {
        // Update count for similar notification instead of creating a new one
        return prev.map(n => {
          if (n.id === similarNotification.id) {
            const count = n.data?.count ? n.data.count + 1 : 2;
            return {
              ...n,
              message: count > 2 ? `${newNotification.message} (${count})` : newNotification.message,
              timestamp: new Date(), // Update timestamp to now
              data: { ...n.data, count, lastMessage: newNotification.message }
            };
          }
          return n;
        });
      } else {
        // Add new notification and limit the total count
        return [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      }
    });
    
    // Only show toast notification if notifications are enabled
    // and not for certain types that can be spammy
    if (notificationsEnabled && type !== 'friend_status') {
      toast({
        title: newNotification.title,
        description: newNotification.message,
        variant: newNotification.type === "error" ? "destructive" : "default"
      });
    }
    
    return newNotification.id;
  }, [toast, notificationsEnabled]);
  
  // Load saved notifications and preferences from localStorage on mount
  useEffect(() => {
    const storedPreference = localStorage.getItem('notificationsEnabled');
    if (storedPreference !== null) {
      setNotificationsEnabled(storedPreference === 'true');
    }
    
    // Load saved notifications
    try {
      const savedNotifications = localStorage.getItem(STORAGE_KEY);
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        // Convert timestamp strings back to Date objects
        const notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(notifications);
      }
    } catch (error) {
      console.error('Error loading saved notifications:', error);
    }
  }, []);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Cleanup function for notification timeouts
  useEffect(() => {
    return () => {
      // Clear all notification timeouts on unmount
      Object.values(notificationTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);
  
  // Function to handle WebSocket messages
  const handleWebSocketMessage = useCallback((event: CustomEvent) => {
    if (!event.detail) return;
    
    const data = event.detail;
    const messageType = data.type;
    
    // Create a "key" for this notification type to track frequency
    const notificationKey = `${messageType}:${JSON.stringify(data.data || {}).substring(0, 50)}`;
    
    // Check if we've shown this type of notification recently (within the last 5 seconds)
    const lastShown = recentNotificationsRef.current[notificationKey] || 0;
    const now = Date.now();
    
    // If we've shown this notification type recently, skip it to prevent spam
    if (now - lastShown < 5000) {
      return;
    }
    
    // Update the "last shown" time for this notification type
    recentNotificationsRef.current[notificationKey] = now;
    
    // Clear this notification type from the tracking after a timeout
    const clearKeyTimeout = setTimeout(() => {
      delete recentNotificationsRef.current[notificationKey];
      delete notificationTimeoutsRef.current[notificationKey];
    }, 5000);
    
    // Store the timeout for cleanup
    notificationTimeoutsRef.current[notificationKey] = clearKeyTimeout;
    
    // Handle different message types
    switch (messageType) {
      // SOCIAL RELATED EVENTS
      case "friend_request":
        if (!data.from?.username) return;
        
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
        
        // Debounced query invalidation
        debounce(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/social/friends/requests"],
            refetchType: "none" // Prevent auto-refresh
          });
        }, 1000)();
        break;
      
      case "friend_request_accepted":
      case "friend_accepted":
        if (!data.username) return;
        
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
        
        // Debounced query invalidation
        debounce(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/social/friends"],
            refetchType: "none" // Prevent auto-refresh
          });
        }, 1000)();
        break;
      
      case "friend_status":
        if (!data.username || !data.status) return;
        
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
        
        // Debounced query invalidation
        debounce(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/social/friends"],
            refetchType: "none" // Prevent auto-refresh
          });
          queryClient.invalidateQueries({ 
            queryKey: ["/api/social/online"],
            refetchType: "none" // Prevent auto-refresh
          });
        }, 1000)();
        break;
      
      case "friend_removed":
        if (!data.username) return;
        
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
        
        // Debounced query invalidation
        debounce(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/social/friends"],
            refetchType: "none" // Prevent auto-refresh
          });
        }, 1000)();
        break;
      
      // MESSAGING RELATED EVENTS
      case "newMessage":
      case "newGangMessage":
      case "new_message":
        if (!data.senderName) {
          return;
        }
        
        const messageContent = data.content || data.preview || "";
        if (!messageContent) return;
        
        addNotification(
          "New Message", 
          `${data.senderName}: ${messageContent}`, 
          "message",
          {
            messageId: data.messageId,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp
          }
        );
        
        // Debounced query invalidation
        debounce(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/messages"],
            refetchType: "none" // Prevent auto-refresh
          });
          queryClient.invalidateQueries({ 
            queryKey: ["/api/messages/unread"],
            refetchType: "none" // Prevent auto-refresh
          });
        }, 1000)();
        break;
      
      case "globalMessage":
        if (!data.content) return;
        
        addNotification(
          "Global Announcement", 
          `${data.senderName || 'System'}: ${data.content}`, 
          "info",
          {
            messageId: data.messageId,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp
          }
        );
        break;
        
      // Don't notify for unreadMessages updates, they're handled elsewhere
      case "unreadMessages":
        // Debounced query invalidation only
        debounce(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/messages/unread"],
            refetchType: "none" // Prevent auto-refresh
          });
        }, 1000)();
        break;
        
      // Handle transaction notifications
      case "cash_transaction":
        if (data.data && typeof data.data.amount === 'number' && Math.abs(data.data.amount) >= 100) {
          const isPositive = data.data.amount > 0;
          addNotification(
            isPositive ? 'Cash Received' : 'Cash Spent',
            `${isPositive ? '+' : ''}$${data.data.amount.toLocaleString()}`,
            isPositive ? 'success' : 'info',
            {
              transactionId: data.data.transactionId,
              amount: data.data.amount,
              newBalance: data.data.newBalance,
              source: data.data.source
            }
          );
        }
        break;
        
      case "respect_change":
        if (data.data && typeof data.data.amount === 'number' && Math.abs(data.data.amount) >= 5) {
          const isPositive = data.data.amount > 0;
          addNotification(
            isPositive ? 'Respect Gained' : 'Respect Lost',
            `${isPositive ? '+' : ''}${data.data.amount} respect points`,
            isPositive ? 'success' : 'warning',
            {
              source: data.data.source,
              amount: data.data.amount,
              newRespect: data.data.newRespect
            }
          );
        }
        break;
        
      case "xp_gain":
        if (data.data && typeof data.data.amount === 'number' && data.data.amount > 0) {
          const levelMessage = data.data.newLevel > data.data.oldLevel
            ? ` (Level up to ${data.data.newLevel}!)`
            : '';
            
          addNotification(
            'Experience Gained',
            `+${data.data.amount} XP${levelMessage}`,
            'success',
            {
              source: data.data.source,
              amount: data.data.amount,
              newXp: data.data.newXp,
              oldLevel: data.data.oldLevel,
              newLevel: data.data.newLevel
            }
          );
        }
        break;
    }
  }, [addNotification]);
  
  // Setup event listener for WebSocket messages
  useEffect(() => {
    const handleWebSocketEvent = (event: Event) => {
      handleWebSocketMessage(event as CustomEvent);
    };
    
    // Listen for custom events dispatched by WebSocketContext
    document.addEventListener('websocket-message', handleWebSocketEvent);
    
    return () => {
      document.removeEventListener('websocket-message', handleWebSocketEvent);
    };
  }, [handleWebSocketMessage]);

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
    localStorage.removeItem(STORAGE_KEY);
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