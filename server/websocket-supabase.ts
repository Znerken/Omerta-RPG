import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { supabaseClient } from './supabase';
import { db } from './db-supabase';
import { users, userStatus } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend WebSocket type to include user properties
declare module 'ws' {
  interface WebSocket {
    _userId?: number;
    _username?: string;
    _isAlive: boolean;
    _lastActivity: number;
  }
}

/**
 * Set up WebSocket server for real-time communication with clients
 * @param httpServer The HTTP server to attach WebSocket server to
 * @returns WebSocketServer instance
 */
export function setupWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws'
  });

  console.log('WebSocket server initialized');

  // Check for expired connections
  const interval = setInterval(() => {
    // Check inactive clients (heartbeat)
    wss.clients.forEach((client) => {
      if (client._isAlive === false) {
        return client.terminate();
      }

      // Mark as inactive until next ping
      client._isAlive = false;

      // Ping to check if still alive
      client.ping();

      // Check for timeout (inactive for more than 5 minutes)
      const inactiveTime = Date.now() - client._lastActivity;
      if (inactiveTime > 5 * 60 * 1000) {
        console.log(`Client inactive for ${inactiveTime}ms, terminating`);
        handleDisconnect(client);
        client.terminate();
      }
    });
  }, 30000); // Check every 30 seconds

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(interval);
  });

  // Handle new connections
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    // Initialize client
    ws._isAlive = true;
    ws._lastActivity = Date.now();

    // Handle heartbeats
    ws.on('pong', () => {
      ws._isAlive = true;
    });

    // Handle messages
    ws.on('message', async (message) => {
      try {
        ws._lastActivity = Date.now();

        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);

        // Handle authentication message
        if (data.type === 'auth') {
          await handleAuth(ws, data);
        }
        // Handle heartbeat message
        else if (data.type === 'heartbeat') {
          handleHeartbeat(ws, data);
        }
        // Handle status update message
        else if (data.type === 'status_update') {
          await handleStatusUpdate(ws, data);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      handleDisconnect(ws);
    });
  });

  /**
   * Handle authentication request from client
   * @param ws WebSocket client
   * @param data Authentication data (token)
   */
  async function handleAuth(ws: WebSocket, data: any) {
    try {
      const { token } = data;

      if (!token) {
        ws.send(JSON.stringify({
          type: 'auth_response',
          success: false,
          error: 'No token provided'
        }));
        return;
      }

      // Verify the token with Supabase
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);

      if (error || !user) {
        ws.send(JSON.stringify({
          type: 'auth_response',
          success: false,
          error: 'Invalid token'
        }));
        return;
      }

      // Find the corresponding user in our database
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.supabaseId, user.id));

      if (!dbUser) {
        ws.send(JSON.stringify({
          type: 'auth_response',
          success: false,
          error: 'User not found'
        }));
        return;
      }

      // Store user info in WebSocket connection
      ws._userId = dbUser.id;
      ws._username = dbUser.username;

      // Update user's online status
      await updateUserStatus(dbUser.id, 'online');

      // Notify client of successful authentication
      ws.send(JSON.stringify({
        type: 'auth_response',
        success: true,
        user: {
          id: dbUser.id,
          username: dbUser.username
        }
      }));

      // Notify other clients that user is online
      for (const client of wss.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN && client._userId) {
          client.send(JSON.stringify({
            type: 'friend_status',
            data: {
              userId: dbUser.id,
              username: dbUser.username,
              avatar: dbUser.avatar,
              status: 'online'
            }
          }));
        }
      }

      console.log(`User ${dbUser.username} (ID: ${dbUser.id}) authenticated via WebSocket`);
    } catch (error) {
      console.error('Error authenticating WebSocket connection:', error);
      ws.send(JSON.stringify({
        type: 'auth_response',
        success: false,
        error: 'Authentication failed'
      }));
    }
  }

  /**
   * Handle heartbeat message from client
   * @param ws WebSocket client
   * @param data Heartbeat data
   */
  function handleHeartbeat(ws: WebSocket, data: any) {
    // Update last activity timestamp
    ws._lastActivity = Date.now();

    // Send heartbeat response
    ws.send(JSON.stringify({
      type: 'heartbeat_response',
      timestamp: Date.now()
    }));
  }

  /**
   * Handle status update message from client
   * @param ws WebSocket client
   * @param data Status data
   */
  async function handleStatusUpdate(ws: WebSocket, data: any) {
    try {
      if (!ws._userId) {
        ws.send(JSON.stringify({
          type: 'status_update_response',
          success: false,
          error: 'Not authenticated'
        }));
        return;
      }

      const { status } = data.data;
      if (!status) {
        ws.send(JSON.stringify({
          type: 'status_update_response',
          success: false,
          error: 'No status provided'
        }));
        return;
      }

      // Update user's status
      await updateUserStatus(ws._userId, status);

      // Send success response
      ws.send(JSON.stringify({
        type: 'status_update_response',
        success: true
      }));

      // Notify other clients of status change
      for (const client of wss.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN && client._userId) {
          client.send(JSON.stringify({
            type: 'friend_status',
            data: {
              userId: ws._userId,
              username: ws._username,
              status
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      ws.send(JSON.stringify({
        type: 'status_update_response',
        success: false,
        error: 'Failed to update status'
      }));
    }
  }

  /**
   * Handle client disconnection
   * @param ws WebSocket client
   */
  async function handleDisconnect(ws: WebSocket) {
    try {
      if (ws._userId) {
        // Update user status to offline
        await updateUserStatus(ws._userId, 'offline');

        // Notify other clients
        for (const client of wss.clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN && client._userId) {
            client.send(JSON.stringify({
              type: 'friend_status',
              data: {
                userId: ws._userId,
                username: ws._username,
                status: 'offline'
              }
            }));
          }
        }

        console.log(`User ${ws._username} (ID: ${ws._userId}) disconnected`);
      }
    } catch (error) {
      console.error('Error handling client disconnection:', error);
    }
  }

  /**
   * Update user's status in the database
   * @param userId User ID
   * @param status Status to set
   */
  async function updateUserStatus(userId: number, status: string) {
    try {
      // Check if user status exists
      const [existingStatus] = await db
        .select()
        .from(userStatus)
        .where(eq(userStatus.userId, userId));

      if (existingStatus) {
        // Update existing status
        await db
          .update(userStatus)
          .set({
            status,
            lastUpdated: new Date()
          })
          .where(eq(userStatus.userId, userId));
      } else {
        // Create new status
        await db
          .insert(userStatus)
          .values({
            userId,
            status,
            lastUpdated: new Date()
          });
      }
    } catch (error) {
      console.error(`Error updating status for user ${userId}:`, error);
      throw error;
    }
  }

  return wss;
}