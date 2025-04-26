import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './supabase';
import { db } from './db-supabase';
import { users, userStatuses } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';

// Extend WebSocket to add custom properties
declare module 'ws' {
  interface WebSocket {
    _isAlive: boolean;
    _lastActivity: number;
    _userId?: number;
  }
}

// Store connected clients by user ID
const clients = new Map<number, Set<WebSocket>>();

// Create a WebSocket server
export function setupWebSocketServer(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Heartbeat interval (30 seconds)
  const HEARTBEAT_INTERVAL = 30000;
  
  // Heartbeat handler
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws._isAlive === false) {
        // Remove connection if it didn't respond to ping
        return ws.terminate();
      }
      
      // Mark as inactive for next ping
      ws._isAlive = false;
      
      // Send ping
      ws.ping();
      
      // Check for inactivity (5 minutes)
      if (Date.now() - ws._lastActivity > 5 * 60 * 1000) {
        return ws.terminate();
      }
    });
  }, HEARTBEAT_INTERVAL);
  
  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // Handle new connections
  wss.on('connection', async (ws, req) => {
    // Set defaults
    ws._isAlive = true;
    ws._lastActivity = Date.now();
    
    // Extract token from URL query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      // No auth token, close connection
      ws.close(4001, 'Authentication required');
      return;
    }
    
    // Verify the token with Supabase
    const supabaseUser = await verifyToken(token);
    if (!supabaseUser) {
      // Invalid token, close connection
      ws.close(4002, 'Invalid authentication token');
      return;
    }
    
    // Get our game user by Supabase ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, supabaseUser.id))
      .limit(1);
    
    if (!user) {
      // User not found in our database, close connection
      ws.close(4003, 'User not found');
      return;
    }
    
    // Store user ID in WebSocket object
    ws._userId = user.id;
    
    // Add to clients map
    if (!clients.has(user.id)) {
      clients.set(user.id, new Set());
    }
    clients.get(user.id)?.add(ws);
    
    // Update online status in database
    await db
      .update(users)
      .set({ status: 'online', lastSeen: new Date() })
      .where(eq(users.id, user.id));
    
    // Broadcast status change to friends
    broadcastStatusChange(user.id, 'online');
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      ws._isAlive = true;
      ws._lastActivity = Date.now();
      
      try {
        const data = JSON.parse(message.toString());
        
        if (!ws._userId) {
          return;
        }
        
        // Process message based on type
        switch (data.type) {
          case 'direct_message':
            await handleDirectMessage(ws._userId, data);
            break;
          
          case 'gang_message':
            await handleGangMessage(ws._userId, data);
            break;
          
          case 'heartbeat':
            // Just update activity timestamp
            break;
          
          default:
            // Unknown message type
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Error processing message' }));
      }
    });
    
    // Handle pong response
    ws.on('pong', () => {
      ws._isAlive = true;
    });
    
    // Handle disconnection
    ws.on('close', async () => {
      if (!ws._userId) {
        return;
      }
      
      // Remove from clients map
      clients.get(ws._userId)?.delete(ws);
      if (clients.get(ws._userId)?.size === 0) {
        clients.delete(ws._userId);
        
        // Update status to offline if no more connections for this user
        await db
          .update(users)
          .set({ status: 'offline', lastSeen: new Date() })
          .where(eq(users.id, ws._userId));
        
        // Broadcast status change to friends
        broadcastStatusChange(ws._userId, 'offline');
      }
    });
    
    // Send initial data to client
    await sendInitialData(ws, user.id);
  });
  
  return wss;
}

/**
 * Send initial data to client on connection
 */
async function sendInitialData(ws: WebSocket, userId: number) {
  try {
    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return;
    }
    
    // Get friend statuses
    const friendStatuses = await getFriendStatuses(userId);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      data: {
        user,
        friends: friendStatuses,
      },
    }));
  } catch (error) {
    console.error('Error sending initial data:', error);
  }
}

/**
 * Get friend statuses for a user
 */
async function getFriendStatuses(userId: number) {
  try {
    // This is a simplified version, you should adjust it based on your friendship model
    const friendStatuses = await db.query.users.findMany({
      where: eq(users.id, userId),
      with: {
        friends: {
          where: eq(users.status, 'accepted'),
          columns: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            lastSeen: true,
          },
        },
      },
    });
    
    return friendStatuses;
  } catch (error) {
    console.error('Error getting friend statuses:', error);
    return [];
  }
}

/**
 * Broadcast status change to friends
 */
async function broadcastStatusChange(userId: number, status: string) {
  try {
    // Get user data
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return;
    }
    
    // Get friends
    const friends = await db.query.users.findMany({
      where: eq(users.id, userId),
      with: {
        friends: {
          where: eq(users.status, 'accepted'),
          columns: {
            id: true,
          },
        },
      },
    });
    
    // Broadcast to all friends
    for (const friend of friends) {
      sendToUser(friend.id, {
        type: 'friend_status',
        data: {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          status,
        },
      });
    }
  } catch (error) {
    console.error('Error broadcasting status change:', error);
  }
}

/**
 * Handle direct message
 */
async function handleDirectMessage(senderId: number, data: any) {
  try {
    const { receiverId, content } = data;
    
    if (!receiverId || !content) {
      return;
    }
    
    // Create message in database
    const [message] = await db
      .insert(messages)
      .values({
        senderId,
        receiverId,
        content,
        type: 'direct',
        timestamp: new Date(),
        read: false,
      })
      .returning();
    
    // Send to sender (all connections)
    sendToUser(senderId, {
      type: 'direct_message',
      data: message,
    });
    
    // Send to receiver (all connections)
    sendToUser(receiverId, {
      type: 'direct_message',
      data: message,
    });
  } catch (error) {
    console.error('Error handling direct message:', error);
  }
}

/**
 * Handle gang message
 */
async function handleGangMessage(senderId: number, data: any) {
  try {
    const { gangId, content } = data;
    
    if (!gangId || !content) {
      return;
    }
    
    // Get user's gang information
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);
    
    if (!user || user.gangId !== gangId) {
      return;
    }
    
    // Create message in database
    const [message] = await db
      .insert(messages)
      .values({
        senderId,
        gangId,
        content,
        type: 'gang',
        timestamp: new Date(),
        read: false,
      })
      .returning();
    
    // Get gang members
    const gangMembers = await db
      .select({
        userId: gangMembers.userId,
      })
      .from(gangMembers)
      .where(eq(gangMembers.gangId, gangId));
    
    // Send to all gang members
    for (const member of gangMembers) {
      sendToUser(member.userId, {
        type: 'gang_message',
        data: {
          ...message,
          senderName: user.username,
          senderAvatar: user.avatar,
        },
      });
    }
  } catch (error) {
    console.error('Error handling gang message:', error);
  }
}

/**
 * Send message to a specific user (all connections)
 */
function sendToUser(userId: number, message: any) {
  const userClients = clients.get(userId);
  
  if (!userClients) {
    return;
  }
  
  const messageString = JSON.stringify(message);
  
  for (const client of userClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  }
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcastToAll(message: any) {
  const messageString = JSON.stringify(message);
  
  for (const [userId, userClients] of clients) {
    for (const client of userClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    }
  }
}