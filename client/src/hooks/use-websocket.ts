import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './use-auth';

export interface WebSocketMessage {
  type: string;
  data: any;
}

// Create a single WebSocket instance that will be reused
let globalSocket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let messageHandlers: Array<(message: WebSocketMessage) => void> = [];

// Global function to add message handlers
function addMessageHandler(handler: (message: WebSocketMessage) => void) {
  messageHandlers.push(handler);
  return () => {
    messageHandlers = messageHandlers.filter(h => h !== handler);
  };
}

export function useWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Handle connection errors with automatic reconnection
  const setupSocket = useCallback(() => {
    if (!user?.id || globalSocket) return;
    
    // Setup the WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    
    // Only create a new socket if one doesn't exist
    const socket = new WebSocket(wsUrl);
    globalSocket = socket;
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        // Set local state for this hook instance
        setLastMessage(data);
        // Distribute message to all registered handlers
        messageHandlers.forEach(handler => handler(data));
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    // Connection closed - attempt reconnect with backoff
    socket.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      globalSocket = null;
      
      // Attempt to reconnect after a delay if the user is still logged in
      if (user?.id && !reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          if (user?.id) setupSocket();
        }, 3000); // 3 second reconnect delay
      }
    });
    
    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      // Don't set isConnected to false here, let the close handler do it
    });
  }, [user?.id]);
  
  useEffect(() => {
    // Only attempt to connect if the user is logged in
    if (!user?.id) {
      setIsConnected(false);
      return;
    }
    
    // If we already have a global socket, use it
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      socketRef.current = globalSocket;
      setIsConnected(true);
    } else {
      // Otherwise set up a new one
      setupSocket();
    }
    
    // Cleanup on unmount - we don't actually close the socket anymore
    // since it's global, but we do cleanup our component state
    return () => {
      socketRef.current = null;
    };
  }, [user?.id, setupSocket]);
  
  // Send a message to the server
  const sendMessage = useCallback((type: string, data: any) => {
    if (globalSocket?.readyState === WebSocket.OPEN) {
      globalSocket.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }, []);
  
  return {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageHandler,
  };
}