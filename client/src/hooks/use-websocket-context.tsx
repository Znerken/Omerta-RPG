import { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useWebSocket, WebSocketMessage } from './use-websocket';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from './use-auth';

type WebSocketContextType = {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (type: string, data: any) => boolean;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage | null) => {
    if (!message) return;

    // Handle different message types
    switch (message.type) {
      case 'friend_status':
        // Friend status update received - invalidate friend lists
        console.log('WebSocket message received:', message);
        
        // Only show toast notification if we have the username and status
        if (message.data && message.data.username && message.data.status) {
          toast({
            title: 'Friend Status Update',
            description: `${message.data.username} is now ${message.data.status}`,
            variant: 'default',
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
        queryClient.invalidateQueries({ queryKey: ['/api/social/online'] });
        break;
      
      case 'friend_request':
        // New friend request received
        toast({
          title: 'Friend Request',
          description: `${message.data.from?.username} sent you a friend request`,
          variant: 'default',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/social/friends/requests'] });
        break;
      
      case 'friend_request_accepted':
        // Friend request accepted
        toast({
          title: 'Friend Request Accepted',
          description: `${message.data.username} accepted your friend request`,
          variant: 'default',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
        break;
      
      case 'friend_removed':
        // Friend removed you
        toast({
          title: 'Friend Removed',
          description: `${message.data.username} has removed you as a friend`,
          variant: 'default',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
        break;
      
      case 'newMessage':
      case 'newGangMessage':
      case 'globalMessage':
        // Handle new messages
        toast({
          title: message.type === 'globalMessage' ? 'Global Announcement' : 'New Message',
          description: `From ${message.data.senderName || 'Unknown'}: ${message.data.content}`,
          variant: 'default',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        break;
      
      case 'unreadMessages':
        // Update unread messages count
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });
        break;
      
      default:
        // Handle other message types as needed
        break;
    }
  }, [toast]);

  // Process incoming messages
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage, handleWebSocketMessage]);

  // Send heartbeat every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected || !user) return;
    
    const interval = setInterval(() => {
      sendMessage('heartbeat', { userId: user.id });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, sendMessage, user]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
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