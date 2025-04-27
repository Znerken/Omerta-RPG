import { useEffect, useRef, useState } from 'react';
import { useSupabaseAuth } from './use-supabase-auth';
import { getAuthToken } from '@/lib/supabase';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const { supabaseUser } = useSupabaseAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Only attempt to connect if the user is logged in
    if (!supabaseUser?.id) {
      setIsConnected(false);
      return;
    }

    let socket: WebSocket | null = null;
    let cleanupFunction: (() => void) | null = null;

    // Setup the WebSocket connection with authentication token
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    const connectWebSocket = async () => {
      try {
        // Get token for authentication
        const token = await getAuthToken();
        
        if (!token) {
          console.error('Could not get authentication token for WebSocket');
          return;
        }
        
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
        
        // Create WebSocket connection
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Connection opened handler
        socket.addEventListener('open', () => {
          console.log('WebSocket connection established');
          setIsConnected(true);
        });
        
        // Message handler
        socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            setLastMessage(data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        });
        
        // Connection closed handler
        socket.addEventListener('close', () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        });
        
        // Error handler
        socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        });
        
        // Define cleanup function
        cleanupFunction = () => {
          console.log('Cleaning up WebSocket connection');
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
          socketRef.current = null;
        };
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    };
    
    // Attempt to connect
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [supabaseUser?.id]);

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