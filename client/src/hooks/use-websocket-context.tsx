import { createContext, useContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket, WebSocketMessage } from './use-websocket';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import { UserStats } from './use-global-stats';

type WebSocketContextType = {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  socket: WebSocket | null;
  sendMessage: (type: string, data: any) => boolean;
  dispatchWebSocketEvent: (message: WebSocketMessage) => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Debounce function to prevent excessive cache invalidations
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

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isConnected, lastMessage, sendMessage, addMessageHandler, socket } = useWebSocket();
  const { toast } = useToast();
  const { user } = useAuth();
  const messageHandlerRef = useRef<(() => void) | null>(null);
  
  // Function to dispatch custom events for WebSocket messages
  const dispatchWebSocketEvent = useCallback((message: WebSocketMessage) => {
    // Create a custom event with the message data
    const event = new CustomEvent('websocket-message', {
      detail: message,
      bubbles: true,
    });
    
    // Dispatch the event so other components can listen for it
    document.dispatchEvent(event);
  }, []);

  // Create debounced versions of cache invalidation functions that won't cause page refreshes
  const debouncedInvalidateFriends = useCallback(
    debounce(() => queryClient.invalidateQueries({ 
      queryKey: ['/api/social/friends'],
      refetchType: "none" // Prevent auto-refresh
    }), 1000),
    []
  );
  
  const debouncedInvalidateOnline = useCallback(
    debounce(() => queryClient.invalidateQueries({ 
      queryKey: ['/api/social/online'],
      refetchType: "none" // Prevent auto-refresh
    }), 1000),
    []
  );
  
  const debouncedInvalidateRequests = useCallback(
    debounce(() => queryClient.invalidateQueries({ 
      queryKey: ['/api/social/friends/requests'],
      refetchType: "none" // Prevent auto-refresh
    }), 1000),
    []
  );
  
  const debouncedInvalidateMessages = useCallback(
    debounce(() => queryClient.invalidateQueries({ 
      queryKey: ['/api/messages'],
      refetchType: "none" // Prevent auto-refresh
    }), 1000),
    []
  );
  
  const debouncedInvalidateUnread = useCallback(
    debounce(() => queryClient.invalidateQueries({ 
      queryKey: ['/api/messages/unread'],
      refetchType: "none" // Prevent auto-refresh
    }), 1000),
    []
  );

  // Create a debounced function to update user stats in the cache without refetching
  const debouncedUpdateUserStats = useCallback(
    debounce((newStats: Partial<UserStats>) => {
      // Update user data in cache directly without refetching
      queryClient.setQueryData(['/api/user'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          ...newStats,
        };
      });
    }, 300),
    []
  );

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (!message) return;
    
    // Dispatch the event for other components to listen for
    dispatchWebSocketEvent(message);
    
    // Handle different message types
    switch (message.type) {
      // USER STATS RELATED EVENTS
      case 'stats_update':
        // User stats were updated - update directly in the cache
        if (message.data) {
          debouncedUpdateUserStats(message.data);
        }
        break;
        
      case 'cash_transaction':
        // Cash amount changed - update directly in the cache
        if (message.data && typeof message.data.newBalance === 'number') {
          debouncedUpdateUserStats({ cash: message.data.newBalance });
          
          // Only show toast for significant transactions
          if (Math.abs(message.data.amount) >= 100) {
            const isPositive = message.data.amount > 0;
            toast({
              title: isPositive ? 'Cash Received' : 'Cash Spent',
              description: `${isPositive ? '+' : ''}$${message.data.amount.toLocaleString()}`,
              variant: isPositive ? 'default' : 'secondary',
            });
          }
        }
        break;
        
      case 'xp_gain':
        // XP was gained - update directly in the cache
        if (message.data) {
          const updates: Partial<UserStats> = { 
            xp: message.data.newXp 
          };
          
          // If level changed, update that too
          if (message.data.newLevel && message.data.newLevel > 0) {
            updates.level = message.data.newLevel;
            
            // Show level up toast
            toast({
              title: 'Level Up!',
              description: `You've reached level ${message.data.newLevel}`,
              variant: 'default',
            });
          }
          
          debouncedUpdateUserStats(updates);
        }
        break;
        
      case 'respect_change':
        // Respect changed - update directly in the cache
        if (message.data && typeof message.data.newRespect === 'number') {
          debouncedUpdateUserStats({ respect: message.data.newRespect });
        }
        break;
        
      // SOCIAL RELATED EVENTS
      case 'friend_status':
        // Friend status update received - invalidate friend lists
        // Only show toast notification if we have the username and status
        if (message.data && message.data.username && message.data.status) {
          toast({
            title: 'Friend Status Update',
            description: `${message.data.username} is now ${message.data.status}`,
            variant: 'default',
          });
        }
        
        debouncedInvalidateFriends();
        debouncedInvalidateOnline();
        break;
      
      case 'friend_request':
        // New friend request received
        toast({
          title: 'Friend Request',
          description: `${message.data.from?.username} sent you a friend request`,
          variant: 'default',
        });
        debouncedInvalidateRequests();
        break;
      
      case 'friend_request_accepted':
        // Friend request accepted
        toast({
          title: 'Friend Request Accepted',
          description: `${message.data.username} accepted your friend request`,
          variant: 'default',
        });
        debouncedInvalidateFriends();
        break;
      
      case 'friend_removed':
        // Friend removed you
        toast({
          title: 'Friend Removed',
          description: `${message.data.username} has removed you as a friend`,
          variant: 'default',
        });
        debouncedInvalidateFriends();
        break;
      
      // MESSAGING RELATED EVENTS  
      case 'newMessage':
      case 'newGangMessage':
      case 'globalMessage':
        // Handle new messages
        toast({
          title: message.type === 'globalMessage' ? 'Global Announcement' : 'New Message',
          description: `From ${message.data.senderName || 'Unknown'}: ${message.data.content}`,
          variant: 'default',
        });
        debouncedInvalidateMessages();
        debouncedInvalidateUnread();
        break;
      
      case 'unreadMessages':
        // Update unread messages count
        debouncedInvalidateUnread();
        break;
      
      default:
        // Handle other message types as needed
        break;
    }
  }, [
    toast, 
    dispatchWebSocketEvent,
    debouncedUpdateUserStats,
    debouncedInvalidateFriends, 
    debouncedInvalidateOnline, 
    debouncedInvalidateRequests, 
    debouncedInvalidateMessages, 
    debouncedInvalidateUnread
  ]);

  // Maintain connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<{
    wasConnected: boolean;
    disconnectTime: number | null;
  }>({
    wasConnected: false,
    disconnectTime: null,
  });

  // Handle connection status changes
  useEffect(() => {
    // If we're connected now
    if (isConnected) {
      // If we were previously disconnected, this is a reconnection
      if (connectionStatus.wasConnected && connectionStatus.disconnectTime) {
        const downtime = Date.now() - connectionStatus.disconnectTime;
        console.log(`Reconnected after ${downtime}ms downtime`);
        
        // If we were disconnected for more than 5 seconds, refresh key data
        if (downtime > 5000) {
          // Invalidate critical data but don't force a refresh
          queryClient.invalidateQueries({ 
            queryKey: ['/api/dashboard'],
            refetchType: "none"
          });
          
          queryClient.invalidateQueries({ 
            queryKey: ['/api/crimes'],
            refetchType: "none"
          });
          
          queryClient.invalidateQueries({ 
            queryKey: ['/api/social/friends'],
            refetchType: "none"
          });
          
          // Show a subtle notification to the user
          toast({
            title: 'Connection Restored',
            description: 'Your connection was restored. Data has been updated.',
            variant: 'default',
          });
        }
      }
      
      // Update connection status
      setConnectionStatus({
        wasConnected: true,
        disconnectTime: null,
      });
    } else if (connectionStatus.wasConnected && !connectionStatus.disconnectTime) {
      // We were connected but now we're not - record disconnection time
      setConnectionStatus({
        ...connectionStatus,
        disconnectTime: Date.now(),
      });
      
      // Only show toast if this isn't initial load
      toast({
        title: 'Connection Issue',
        description: 'Connection to server lost. Attempting to reconnect...',
        variant: 'destructive',
      });
    }
  }, [isConnected, connectionStatus, toast]);

  // Register message handler once
  useEffect(() => {
    if (messageHandlerRef.current) {
      messageHandlerRef.current();
    }
    
    // Register handler with the global WebSocket system
    messageHandlerRef.current = addMessageHandler(handleWebSocketMessage);
    
    // Cleanup when component unmounts
    return () => {
      if (messageHandlerRef.current) {
        messageHandlerRef.current();
        messageHandlerRef.current = null;
      }
    };
  }, [handleWebSocketMessage, addMessageHandler]);

  // Send heartbeat more frequently and implement adaptive timing
  useEffect(() => {
    if (!user?.id) return;
    
    // Start with 15 second heartbeat interval
    let heartbeatInterval = 15000;
    
    // If we're reconnecting after a disconnect, use more frequent heartbeats at first
    if (connectionStatus.disconnectTime !== null) {
      heartbeatInterval = 5000;
    }
    
    // Adaptive heartbeat timer
    let heartbeatRetries = 0;
    let consecutiveSuccesses = 0;
    
    const sendHeartbeat = () => {
      if (!isConnected) {
        heartbeatRetries++;
        // If we've failed multiple times, don't keep trying as frequently
        if (heartbeatRetries > 3) {
          heartbeatInterval = Math.min(heartbeatInterval * 1.5, 60000); // Increase up to 1 minute max
        }
        return; // Don't send if not connected
      }
      
      // Send the heartbeat
      const heartbeatSuccess = sendMessage('heartbeat', { 
        userId: user.id,
        timestamp: Date.now(),
        clientInfo: {
          url: window.location.pathname,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        }
      });
      
      if (heartbeatSuccess) {
        heartbeatRetries = 0;
        consecutiveSuccesses++;
        
        // If we've had several successful heartbeats, gradually increase interval
        // to reduce unnecessary network traffic
        if (consecutiveSuccesses > 5 && heartbeatInterval < 30000) {
          heartbeatInterval = Math.min(heartbeatInterval * 1.2, 30000); // Increase up to 30 seconds max
        }
      } else {
        heartbeatRetries++;
        consecutiveSuccesses = 0;
        // If we've failed multiple times, decrease interval to try more frequently
        if (heartbeatRetries > 1) {
          heartbeatInterval = Math.max(heartbeatInterval / 1.5, 5000); // Min 5 seconds
        }
      }
    };
    
    // Send initial heartbeat immediately
    sendHeartbeat();
    
    // Set up interval with adaptive timing
    const interval = setInterval(sendHeartbeat, heartbeatInterval);
    
    return () => clearInterval(interval);
  }, [sendMessage, user, isConnected, connectionStatus.disconnectTime]);

  return (
    <WebSocketContext.Provider value={{ 
      isConnected, 
      lastMessage, 
      socket, 
      sendMessage, 
      dispatchWebSocketEvent 
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}