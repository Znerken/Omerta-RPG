import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './supabase';
import { storage } from './storage-supabase';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import { db } from './db-supabase';

// Define interfaces for WebSocket with custom properties
interface MafiaWebSocket extends WebSocket {
  isAlive: boolean;
  lastActivity: Date;
  userId?: number;
}

// Store connections by user ID
const connections = new Map<number, Set<MafiaWebSocket>>();

/**
 * Setup WebSocket server
 * @param httpServer HTTP server
 * @returns WebSocket server
 */
export function setupWebSocketServer(httpServer: Server): WebSocketServer {
  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true
  });

  // Handle new connections
  wss.on('connection', async (ws: WebSocket, req) => {
    const socket = ws as MafiaWebSocket;
    socket.isAlive = true;
    socket.lastActivity = new Date();

    try {
      // Get token from query parameters
      const url = new URL(`http://localhost${req.url}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.log('WebSocket connection rejected - no token provided');
        socket.close(4001, 'Authentication required');
        return;
      }

      // Verify token with Supabase
      const supabaseUser = await verifyToken(token);
      if (!supabaseUser) {
        console.log('WebSocket connection rejected - invalid token');
        socket.close(4002, 'Invalid authentication token');
        return;
      }

      // Get user from our database
      const user = await storage.getUserBySupabaseId(supabaseUser.id);
      if (!user) {
        console.log('WebSocket connection rejected - user not found');
        socket.close(4003, 'User not found');
        return;
      }

      // Set user ID on socket
      socket.userId = user.id;

      // Add socket to connections map
      if (!connections.has(user.id)) {
        connections.set(user.id, new Set());
      }
      connections.get(user.id)?.add(socket);

      // Update user status to online
      await db.update(users)
        .set({ 
          status: 'online',
          lastSeen: new Date()
        })
        .where(eq(users.id, user.id));

      console.log(`WebSocket connection established for user ${user.id} (${user.username})`);

      // Send welcome message
      socket.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connection established',
        userId: user.id,
        timestamp: new Date().toISOString()
      }));

      // Broadcast user online status to friends
      broadcastUserStatus(user.id, 'online');

      // Handle messages
      socket.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          socket.lastActivity = new Date();

          // Handle different message types
          switch (data.type) {
            case 'heartbeat':
              socket.isAlive = true;
              break;
            case 'chat_message':
              handleChatMessage(socket, data);
              break;
            case 'status_update':
              handleStatusUpdate(socket, data);
              break;
            default:
              console.log(`Unknown message type: ${data.type}`);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Handle close
      socket.on('close', async () => {
        handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        handleDisconnect(socket);
      });
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      socket.close(4000, 'Internal server error');
    }
  });

  // Setup ping interval to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const socket = ws as MafiaWebSocket;
      
      if (socket.isAlive === false) {
        handleDisconnect(socket);
        return;
      }

      // Check for inactivity timeout (15 minutes)
      const inactivityTimeout = 15 * 60 * 1000; // 15 minutes
      if (Date.now() - socket.lastActivity.getTime() > inactivityTimeout) {
        console.log('Client inactive for too long, closing connection');
        handleDisconnect(socket);
        return;
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  return wss;
}

/**
 * Handle disconnection of a socket
 * @param socket WebSocket to disconnect
 */
async function handleDisconnect(socket: MafiaWebSocket): Promise<void> {
  if (!socket.userId) return;

  // Remove socket from connections map
  const userSockets = connections.get(socket.userId);
  if (userSockets) {
    userSockets.delete(socket);
    
    // If no more connections for this user, update status to offline
    if (userSockets.size === 0) {
      connections.delete(socket.userId);
      
      try {
        // Update user status to offline
        await db.update(users)
          .set({ 
            status: 'offline',
            lastSeen: new Date()
          })
          .where(eq(users.id, socket.userId));
        
        // Broadcast user offline status to friends
        broadcastUserStatus(socket.userId, 'offline');
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
  }

  // Terminate socket if still open
  if (socket.readyState === WebSocket.OPEN) {
    socket.terminate();
  }
}

/**
 * Handle chat message
 * @param socket Socket that sent the message
 * @param data Message data
 */
async function handleChatMessage(socket: MafiaWebSocket, data: any): Promise<void> {
  if (!socket.userId) return;
  
  try {
    const { recipientId, content, type = 'direct' } = data;
    
    // Store message in database
    const message = await storage.sendMessage({
      senderId: socket.userId,
      receiverId: type === 'direct' ? recipientId : null,
      gangId: type === 'gang' ? recipientId : null,
      content,
      type,
      timestamp: new Date(),
      read: false
    });
    
    // Send message to recipient
    if (type === 'direct' && recipientId) {
      const recipientSockets = connections.get(recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        const messagePayload = JSON.stringify({
          type: 'chat_message',
          message
        });
        
        for (const recipientSocket of recipientSockets) {
          if (recipientSocket.readyState === WebSocket.OPEN) {
            recipientSocket.send(messagePayload);
          }
        }
      }
    } else if (type === 'gang' && recipientId) {
      // Send message to all gang members
      const gangMembers = await storage.getGangMembers(recipientId);
      
      for (const member of gangMembers) {
        if (member.userId === socket.userId) continue; // Skip sender
        
        const memberSockets = connections.get(member.userId);
        if (memberSockets && memberSockets.size > 0) {
          const messagePayload = JSON.stringify({
            type: 'chat_message',
            message
          });
          
          for (const memberSocket of memberSockets) {
            if (memberSocket.readyState === WebSocket.OPEN) {
              memberSocket.send(messagePayload);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling chat message:', error);
  }
}

/**
 * Handle status update
 * @param socket Socket that sent the update
 * @param data Status data
 */
async function handleStatusUpdate(socket: MafiaWebSocket, data: any): Promise<void> {
  if (!socket.userId) return;
  
  try {
    const { status } = data;
    
    // Update user status
    await db.update(users)
      .set({ status })
      .where(eq(users.id, socket.userId));
    
    // Broadcast status to friends
    broadcastUserStatus(socket.userId, status);
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

/**
 * Broadcast user status to friends
 * @param userId User ID
 * @param status New status
 */
async function broadcastUserStatus(userId: number, status: string): Promise<void> {
  try {
    // Get user's friends
    const friends = await storage.getUserFriends(userId);
    
    // Broadcast status to online friends
    for (const friend of friends) {
      const friendSockets = connections.get(friend.id);
      if (friendSockets && friendSockets.size > 0) {
        const statusPayload = JSON.stringify({
          type: 'friend_status_update',
          userId,
          status,
          timestamp: new Date().toISOString()
        });
        
        for (const friendSocket of friendSockets) {
          if (friendSocket.readyState === WebSocket.OPEN) {
            friendSocket.send(statusPayload);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error broadcasting status:', error);
  }
}

/**
 * Send notification to a user
 * @param userId User ID
 * @param notification Notification data
 */
export function sendNotification(userId: number, notification: any): void {
  const userSockets = connections.get(userId);
  if (!userSockets || userSockets.size === 0) return;
  
  const payload = JSON.stringify({
    type: 'notification',
    ...notification,
    timestamp: new Date().toISOString()
  });
  
  for (const socket of userSockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

/**
 * Broadcast message to all connected users
 * @param message Message to broadcast
 */
export function broadcastMessage(message: any): void {
  const payload = JSON.stringify({
    type: 'broadcast',
    ...message,
    timestamp: new Date().toISOString()
  });
  
  for (const [userId, userSockets] of connections) {
    for (const socket of userSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }
}