import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Only attempt to connect if the user is logged in
    if (!user?.id) {
      setIsConnected(false);
      return;
    }

    // Setup the WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;

    // Create the WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        setLastMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    // Connection closed
    socket.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('Closing WebSocket connection');
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      socketRef.current = null;
    };
  }, [user?.id]);

  // Send a message to the server
  const sendMessage = (type: string, data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}