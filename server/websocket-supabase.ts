import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { supabaseClient } from './supabase';
import { db } from './db-supabase';
import { users, userStatus } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Client tracking
type Client = {
  id: string;
  userId?: number;
  ws: any;
};

// Connected clients map
const clients: Map<string, Client> = new Map();

/**
 * Set up WebSocket server and Supabase realtime subscriptions
 */
export function setupWebSocketServer(server: Server) {
  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('WebSocket server initialized');

  // Set up Supabase realtime subscriptions
  setupSupabaseRealtime();

  // Handle WebSocket connections
  wss.on('connection', (ws: any) => {
    // Generate a unique client ID
    const clientId = generateId();
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Store the client
    clients.set(clientId, { id: clientId, ws });

    // Handle authentication (required to link the socket to a user)
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'authenticate') {
          const { token } = data;
          
          // Verify token with Supabase
          const { data: { user }, error } = await supabaseClient.auth.getUser(token);
          
          if (error || !user) {
            sendToClient(clientId, { type: 'auth_error', message: 'Authentication failed' });
            return;
          }
          
          // Get user from database
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.supabaseId, user.id));
            
          if (!dbUser) {
            sendToClient(clientId, { type: 'auth_error', message: 'User not found' });
            return;
          }
          
          // Update client with user ID
          const client = clients.get(clientId);
          if (client) {
            client.userId = dbUser.id;
            
            // Update user status to online
            await db
              .update(userStatus)
              .set({ status: 'online', lastActive: new Date() })
              .where(eq(userStatus.userId, dbUser.id));
              
            sendToClient(clientId, { type: 'auth_success', userId: dbUser.id });
            
            // Broadcast user status change
            broadcastUserStatusChange(dbUser.id, 'online');
          }
        }
        
        // Handle other message types
        if (data.type === 'ping') {
          sendToClient(clientId, { type: 'pong' });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', async () => {
      const client = clients.get(clientId);
      
      console.log(`WebSocket client disconnected: ${clientId}`);
      
      // If this was an authenticated user, update their status
      if (client?.userId) {
        await db
          .update(userStatus)
          .set({ status: 'offline', lastActive: new Date() })
          .where(eq(userStatus.userId, client.userId));
          
        // Broadcast user status change
        broadcastUserStatusChange(client.userId, 'offline');
      }
      
      // Remove client
      clients.delete(clientId);
    });

    // Send welcome message
    sendToClient(clientId, { type: 'welcome', message: 'Connected to OMERTÀ game server' });
  });

  return wss;
}

/**
 * Set up Supabase Realtime subscriptions
 */
function setupSupabaseRealtime() {
  // Subscribe to friend requests table
  const friendRequestSubscription = supabaseClient
    .channel('friend-requests')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'friend_requests' }, 
      payload => {
        const { new: newRequest } = payload;
        
        // Find the receiver's client connection
        const receiverClient = findClientByUserId(newRequest.receiver_id);
        if (receiverClient) {
          sendToClient(receiverClient.id, {
            type: 'friend_request',
            requestId: newRequest.id,
            senderId: newRequest.sender_id,
          });
        }
      }
    )
    .subscribe();
    
  // Subscribe to messages table
  const messagesSubscription = supabaseClient
    .channel('messages')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'messages' }, 
      payload => {
        const { new: newMessage } = payload;
        
        // If it's a personal message, send to receiver
        if (newMessage.type === 'personal' && newMessage.receiver_id) {
          const receiverClient = findClientByUserId(newMessage.receiver_id);
          if (receiverClient) {
            sendToClient(receiverClient.id, {
              type: 'new_message',
              messageId: newMessage.id,
              senderId: newMessage.sender_id,
              content: newMessage.content,
              messageType: newMessage.type,
            });
          }
        }
        
        // If it's a gang message, send to all gang members
        if (newMessage.type === 'gang' && newMessage.gang_id) {
          // This would require querying gang members - we'll implement this as needed
        }
        
        // Global messages would go to all authenticated clients
        if (newMessage.type === 'global') {
          broadcastToAuthenticated({
            type: 'new_message',
            messageId: newMessage.id,
            senderId: newMessage.sender_id,
            content: newMessage.content,
            messageType: newMessage.type,
          });
        }
      }
    )
    .subscribe();
    
  // Add more subscriptions as needed
  
  // Return subscriptions for cleanup
  return {
    friendRequestSubscription,
    messagesSubscription,
  };
}

/**
 * Find a client by user ID
 */
function findClientByUserId(userId: number): Client | undefined {
  for (const client of clients.values()) {
    if (client.userId === userId) {
      return client;
    }
  }
  return undefined;
}

/**
 * Send a message to a specific client
 */
function sendToClient(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === 1) { // WebSocket.OPEN
    client.ws.send(JSON.stringify(data));
  }
}

/**
 * Broadcast a message to all authenticated clients
 */
function broadcastToAuthenticated(data: any) {
  for (const client of clients.values()) {
    if (client.userId && client.ws.readyState === 1) { // WebSocket.OPEN
      client.ws.send(JSON.stringify(data));
    }
  }
}

/**
 * Broadcast user status change to all authenticated clients
 */
function broadcastUserStatusChange(userId: number, status: 'online' | 'offline' | 'away' | 'busy') {
  broadcastToAuthenticated({
    type: 'user_status_change',
    userId,
    status,
  });
}

/**
 * Generate a random ID
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}