import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';

export type WebSocketMessage = {
  type: string;
  data: any;
};

type MessageHandler = (message: WebSocketMessage) => void;

/**
 * Hook for managing WebSocket connections with reconnection and message handling capabilities
 */
export function useWebSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const messageHandlers = useRef<Set<MessageHandler>>(new Set());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const MAX_RECONNECT_DELAY = 30000; // Maximum reconnect delay in ms (30 seconds)
  const BASE_RECONNECT_DELAY = 1000; // Base reconnect delay in ms (1 second)
  
  // Function for adding message handlers
  const addMessageHandler = useCallback((handler: MessageHandler) => {
    messageHandlers.current.add(handler);
    
    // Return a function to remove the handler
    return () => {
      messageHandlers.current.delete(handler);
    };
  }, []);

  // Send a message through the WebSocket
  const sendMessage = useCallback(
    (type: string, data: any): boolean => {
      if (socket && isConnected) {
        try {
          socket.send(JSON.stringify({ type, data }));
          return true;
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          return false;
        }
      }
      return false;
    },
    [socket, isConnected]
  );

  // Function to handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Set last message for direct consumers of this hook
      setLastMessage(message);
      
      // Call all registered message handlers
      messageHandlers.current.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  // Calculate exponential backoff for reconnection attempts
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      MAX_RECONNECT_DELAY,
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempt)
    );
    // Add some randomness to prevent all clients from reconnecting simultaneously
    return delay + Math.random() * 1000;
  }, [reconnectAttempt]);

  // Handle reconnection
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = getReconnectDelay();
    console.log(`WebSocket reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempt + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempt(prev => prev + 1);
      // The dependency array will trigger a new connection
    }, delay);
  }, [getReconnectDelay, reconnectAttempt]);

  // Establish WebSocket connection
  useEffect(() => {
    if (!user?.id) return; // Don't connect if user is not logged in
    
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Create the WebSocket connection
    const connectWebSocket = () => {
      try {
        // Clear any existing reconnect timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Create the WebSocket URL with user ID for authentication
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        
        // Set a connection timeout in case the WebSocket gets stuck connecting
        const connectionTimeoutId = setTimeout(() => {
          if (isMounted && newSocket && newSocket.readyState === WebSocket.CONNECTING) {
            console.warn('WebSocket connection timeout - forcing reconnect');
            try {
              newSocket.close();
            } catch (e) {
              // Ignore
            }
            if (isMounted) {
              setIsConnected(false);
              reconnect();
            }
          }
        }, 10000); // 10 second connection timeout
        
        const newSocket = new WebSocket(wsUrl);
        
        // Set up event handlers
        newSocket.onopen = () => {
          clearTimeout(connectionTimeoutId);
          if (!isMounted) return;
          
          console.log('WebSocket connection established');
          setIsConnected(true);
          setReconnectAttempt(0); // Reset reconnect attempts on successful connection
          
          // Send an initial message to identify the user
          try {
            newSocket.send(JSON.stringify({ 
              type: 'identify', 
              data: { userId: user.id } 
            }));
          } catch (e) {
            console.error('Error sending identify message:', e);
          }
          
          // Send a heartbeat immediately to verify the connection
          try {
            newSocket.send(JSON.stringify({ 
              type: 'heartbeat', 
              data: { userId: user.id, timestamp: Date.now() } 
            }));
          } catch (e) {
            console.error('Error sending initial heartbeat:', e);
          }
        };
        
        newSocket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            handleMessage(event);
          } catch (e) {
            console.error('Error handling WebSocket message:', e);
          }
        };
        
        newSocket.onclose = (event) => {
          clearTimeout(connectionTimeoutId);
          if (!isMounted) return;
          
          console.log('WebSocket disconnected', event.code, event.reason);
          setIsConnected(false);
          setSocket(null);
          
          // Don't attempt to reconnect if the socket was closed due to logout
          // or if it was a clean closure from the server (code 1000)
          if (user?.id && event.code !== 1000) {
            reconnect();
          }
        };
        
        newSocket.onerror = (error) => {
          if (!isMounted) return;
          console.error('WebSocket error:', error);
          // The socket will also emit a close event after an error
        };
        
        // Store the socket if component is still mounted
        if (isMounted) {
          setSocket(newSocket);
        }
        
        // Clean up on unmount
        return () => {
          clearTimeout(connectionTimeoutId);
          
          if (newSocket) {
            try {
              // Only close if it's not already closing or closed
              if (newSocket.readyState === WebSocket.OPEN ||
                  newSocket.readyState === WebSocket.CONNECTING) {
                
                // First remove event handlers to prevent any callbacks during closing
                newSocket.onopen = null;
                newSocket.onmessage = null;
                newSocket.onclose = null;
                newSocket.onerror = null;
                
                // Send a clean disconnect message if possible
                if (newSocket.readyState === WebSocket.OPEN) {
                  try {
                    newSocket.send(JSON.stringify({
                      type: 'disconnect',
                      data: { userId: user.id, reason: 'user_action' }
                    }));
                  } catch (e) {
                    // Ignore errors when sending disconnect message
                  }
                }
                
                // Then close the connection
                newSocket.close();
              }
            } catch (error) {
              console.error('Error closing WebSocket:', error);
            }
          }
        };
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        if (isMounted) {
          reconnect();
        }
        return () => {}; // Empty cleanup function
      }
    };
    
    // Connect the WebSocket
    const cleanup = connectWebSocket();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      
      if (cleanup) {
        cleanup();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [user?.id, handleMessage, reconnect]);

  // Perform a health check periodically
  useEffect(() => {
    if (!isConnected || !socket) return;
    
    // Send a ping every 30 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'ping', data: { timestamp: Date.now() } }));
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      }
    }, 30000);
    
    return () => clearInterval(pingInterval);
  }, [isConnected, socket]);

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    addMessageHandler,
    reconnectAttempt
  };
}