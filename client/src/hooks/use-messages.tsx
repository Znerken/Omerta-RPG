import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

type MessagesContextType = {
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
};

const MessagesContext = createContext<MessagesContextType | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Query for fetching unread messages count
  const { 
    data: unreadMessages = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/messages/unread'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/messages/unread');
      return res.json();
    },
    onSuccess: (data) => {
      setUnreadCount(data.length);
    },
    // Don't fetch if user is not logged in
    enabled: !!user
  });

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Make sure the user ID is a valid number to avoid 400 errors
    const userId = typeof user.id === 'number' ? user.id : parseInt(String(user.id), 10);
    
    if (isNaN(userId)) {
      console.error("Invalid user ID for WebSocket connection:", user.id);
      return;
    }
    
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
    console.log("Messages: Connecting to WebSocket:", wsUrl);

    // Close existing connection if any
    if (socket) {
      socket.close();
    }

    // Create new WebSocket connection
    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log('Messages WebSocket connection established');
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'unreadMessages') {
          setUnreadCount(data.data.count);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    // Clean up on unmount or when user changes
    return () => {
      if (newSocket) {
        console.log('Closing messages WebSocket connection');
        newSocket.close();
      }
    };
  }, [user]);

  return (
    <MessagesContext.Provider value={{ unreadCount, isLoading, error }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}