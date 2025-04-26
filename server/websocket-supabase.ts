import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { validateSupabaseToken } from './supabase';
import { db } from './db-supabase';
import { userStatuses, type InsertUserStatus } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend WebSocket interface to include user data
declare module 'ws' {
  interface WebSocket {
    _isAlive: boolean;
    _userId?: number;
    _lastActivity: Date;
  }
}

// Store connected clients by user ID
const clients = new Map<number, Set<WebSocket>>();

/**
 * Set up WebSocket server
 * @param server HTTP server to attach WebSocket server to
 * @returns WebSocket server instance
 */
export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws' 
  });

  wss.on('connection', (ws) => {
    // Initialize connection
    ws._isAlive = true;
    ws._lastActivity = new Date();

    // Setup ping to keep connection alive
    ws.on('pong', () => {
      ws._isAlive = true;
    });

    // Handle messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        ws._lastActivity = new Date();

        // Handle authentication
        if (data.type === 'auth') {
          await handleAuth(ws, data.token);
        }
        // Handle other message types
        else if (ws._userId) {
          // User must be authenticated to send other messages
          await handleMessage(ws, data);
        } else {
          // Not authenticated
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication required'
          }));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (ws._userId) {
        removeClient(ws, ws._userId);
        updateUserStatus(ws._userId, 'offline');
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (ws._userId) {
        removeClient(ws, ws._userId);
        updateUserStatus(ws._userId, 'offline');
      }
    });
  });

  // Set up interval to clean up dead connections
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws._isAlive === false) {
        if (ws._userId) {
          removeClient(ws, ws._userId);
          updateUserStatus(ws._userId, 'offline');
        }
        ws.terminate();
        return;
      }

      ws._isAlive = false;
      ws.ping();
      
      // Check if user has been inactive for too long
      const now = new Date();
      const inactiveTime = now.getTime() - ws._lastActivity.getTime();
      
      // If inactive for more than 30 minutes, set status to 'away'
      if (inactiveTime > 30 * 60 * 1000 && ws._userId) {
        updateUserStatus(ws._userId, 'away');
      }
    });
  }, 30000);

  // Clean up interval when server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  return wss;
}

/**
 * Handle authentication message
 * @param ws WebSocket connection
 * @param token Supabase JWT token
 */
async function handleAuth(ws: WebSocket, token: string): Promise<void> {
  try {
    // Validate token
    const supabaseUser = await validateSupabaseToken(token);
    
    if (!supabaseUser) {
      ws.send(JSON.stringify({
        type: 'auth_response',
        success: false,
        error: 'Invalid token'
      }));
      return;
    }
    
    // Get user from database
    const [user] = await db
      .select()
      .from(userStatuses)
      .where(eq(userStatuses.supabaseId, supabaseUser.id));
    
    if (!user) {
      ws.send(JSON.stringify({
        type: 'auth_response',
        success: false,
        error: 'User not found'
      }));
      return;
    }

    // Add client to map
    ws._userId = user.userId;
    addClient(ws, user.userId);
    
    // Update user status to online
    await updateUserStatus(user.userId, 'online');
    
    // Send successful auth response
    ws.send(JSON.stringify({
      type: 'auth_response',
      success: true,
      userId: user.userId
    }));
    
    // Broadcast user online status
    broadcastUserStatus(user.userId, 'online');
  } catch (error) {
    console.error('Auth error:', error);
    ws.send(JSON.stringify({
      type: 'auth_response',
      success: false,
      error: 'Authentication failed'
    }));
  }
}

/**
 * Handle incoming messages
 * @param ws WebSocket connection
 * @param data Message data
 */
async function handleMessage(ws: WebSocket, data: any): Promise<void> {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
      
    case 'status_change':
      if (ws._userId && data.status) {
        await updateUserStatus(ws._userId, data.status);
        broadcastUserStatus(ws._userId, data.status);
      }
      break;
      
    case 'location_change':
      if (ws._userId && data.location) {
        await updateUserLocation(ws._userId, data.location);
      }
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
}

/**
 * Add client to the clients map
 * @param ws WebSocket connection
 * @param userId User ID
 */
function addClient(ws: WebSocket, userId: number): void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  
  clients.get(userId)!.add(ws);
  console.log(`User ${userId} connected. Total connections: ${clients.get(userId)!.size}`);
}

/**
 * Remove client from the clients map
 * @param ws WebSocket connection
 * @param userId User ID
 */
function removeClient(ws: WebSocket, userId: number): void {
  const userClients = clients.get(userId);
  
  if (userClients) {
    userClients.delete(ws);
    
    if (userClients.size === 0) {
      clients.delete(userId);
    }
    
    console.log(`User ${userId} disconnected. Remaining connections: ${userClients.size}`);
  }
}

/**
 * Update user status in database
 * @param userId User ID
 * @param status Status to set
 */
async function updateUserStatus(userId: number, status: string): Promise<void> {
  try {
    const [existingStatus] = await db
      .select()
      .from(userStatuses)
      .where(eq(userStatuses.userId, userId));
    
    if (existingStatus) {
      await db
        .update(userStatuses)
        .set({ status, lastActive: new Date() })
        .where(eq(userStatuses.userId, userId));
    } else {
      await db
        .insert(userStatuses)
        .values({
          userId,
          status,
          lastActive: new Date(),
          lastLocation: 'Unknown',
          lastUpdated: new Date()
        } as InsertUserStatus);
    }
  } catch (error) {
    console.error(`Error updating status for user ${userId}:`, error);
  }
}

/**
 * Update user location in database
 * @param userId User ID
 * @param location Location to set
 */
async function updateUserLocation(userId: number, location: string): Promise<void> {
  try {
    const [existingStatus] = await db
      .select()
      .from(userStatuses)
      .where(eq(userStatuses.userId, userId));
    
    if (existingStatus) {
      await db
        .update(userStatuses)
        .set({ lastLocation: location, lastActive: new Date() })
        .where(eq(userStatuses.userId, userId));
    } else {
      await db
        .insert(userStatuses)
        .values({
          userId,
          status: 'online',
          lastActive: new Date(),
          lastLocation: location,
          lastUpdated: new Date()
        } as InsertUserStatus);
    }
  } catch (error) {
    console.error(`Error updating location for user ${userId}:`, error);
  }
}

/**
 * Broadcast user status to friends
 * @param userId User ID
 * @param status Status to broadcast
 */
async function broadcastUserStatus(userId: number, status: string): Promise<void> {
  try {
    // In a real app, you would get the user's friends and only broadcast to them
    // For simplicity, we're not implementing the friends logic here
    const message = JSON.stringify({
      type: 'user_status_change',
      userId,
      status
    });
    
    // Broadcast to all connected clients
    for (const [, userClients] of clients) {
      for (const client of userClients) {
        if (client._userId !== userId && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }
  } catch (error) {
    console.error(`Error broadcasting status for user ${userId}:`, error);
  }
}

/**
 * Send notification to specific user
 * @param userId User ID to send notification to
 * @param type Notification type
 * @param data Notification data
 */
export function notifyUser(userId: number, type: string, data: any): void {
  const userClients = clients.get(userId);
  if (!userClients) return;
  
  const message = JSON.stringify({
    type,
    data
  });
  
  for (const client of userClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

/**
 * Broadcast message to all connected clients
 * @param type Message type
 * @param data Message data
 */
export function broadcast(type: string, data: any): void {
  const message = JSON.stringify({
    type,
    data
  });
  
  for (const [, userClients] of clients) {
    for (const client of userClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

/**
 * Get users with online status
 * @returns Array of online user IDs
 */
export function getOnlineUsers(): number[] {
  return Array.from(clients.keys());
}