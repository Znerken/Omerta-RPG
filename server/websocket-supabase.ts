import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { supabaseClient } from './supabase';
import { storage } from './storage-supabase';
import url from 'url';

// Store active WebSocket connections by user ID
const userConnections: Map<number, Set<WebSocket>> = new Map();
// Store user IDs associated with WebSocket connections
const connectionUsers: Map<WebSocket, number> = new Map();

// Set up WebSocket server
export function setupWebSockets(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', async (ws, req) => {
    let userId: number | null = null;
    
    try {
      // Extract access token from URL
      const { query } = url.parse(req.url || '', true);
      const accessToken = query.access_token as string;
      
      if (!accessToken) {
        ws.close(1008, 'Authentication required');
        return;
      }
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
      
      if (error || !user) {
        ws.close(1008, 'Invalid token');
        return;
      }
      
      // Get internal user ID from our database
      const dbUser = await storage.getUserByEmail(user.email || '');
      
      if (!dbUser) {
        ws.close(1008, 'User not found');
        return;
      }
      
      userId = dbUser.id;
      
      // Store connection
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId)!.add(ws);
      connectionUsers.set(ws, userId);
      
      console.log(`User ${userId} connected via WebSocket. Active connections: ${userConnections.get(userId)!.size}`);
      
      // Update user status to online
      updateUserStatus(userId, 'online');
      
      // Broadcast user status to other users
      broadcastUserStatus(userId, dbUser.username, dbUser.avatar, 'online');
      
      // Send list of online users to the newly connected user
      sendOnlineUsers(ws);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
    
    // Setup message handling
    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Received message from user', userId, ':', parsedMessage);
        
        // Handle different message types
        switch (parsedMessage.type) {
          case 'heartbeat':
            // Keep connection alive
            ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
            break;
            
          case 'chat_message':
            // Handle chat messages
            if (userId && parsedMessage.data && parsedMessage.data.recipientId) {
              const { recipientId, content } = parsedMessage.data;
              // Store message in database
              // Notify recipient if online
              notifyUser(recipientId, 'new_message', {
                senderId: userId,
                content,
                timestamp: new Date().toISOString()
              });
            }
            break;
            
          default:
            console.log('Unknown message type:', parsedMessage.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (userId) {
        // Remove from collections
        if (userConnections.has(userId)) {
          userConnections.get(userId)!.delete(ws);
          if (userConnections.get(userId)!.size === 0) {
            userConnections.delete(userId);
            // Update status to offline if no connections left
            updateUserStatus(userId, 'offline');
            // Broadcast offline status
            broadcastUserStatus(userId, null, null, 'offline');
            console.log(`No active connections for user ${userId}`);
          } else {
            console.log(`User ${userId} disconnected. Remaining connections: ${userConnections.get(userId)!.size}`);
          }
        }
        connectionUsers.delete(ws);
      }
    });
  });
  
  // Set up interval to check for dead connections
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);
  
  return wss;
}

// Function to send a message to a specific user
export function notifyUser(userId: number, type: string, data: any) {
  if (userConnections.has(userId)) {
    const connections = userConnections.get(userId)!;
    const message = JSON.stringify({ type, data });
    
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Function to broadcast a message to all connected users
export function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  
  userConnections.forEach((connections) => {
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  });
}

// Update user status in database
async function updateUserStatus(userId: number, status: 'online' | 'offline') {
  try {
    // Ideally we would update in the database, but for now we'll just track in memory
    console.log(`User ${userId} is now ${status}`);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

// Broadcast user status change to other users
function broadcastUserStatus(userId: number, username: string | null, avatar: string | null, status: 'online' | 'offline') {
  broadcast('friend_status', {
    userId,
    username,
    avatar,
    status
  });
}

// Send list of online users to a client
async function sendOnlineUsers(ws: WebSocket) {
  try {
    const onlineUserIds = Array.from(userConnections.keys());
    
    // Get user details from the database
    const onlineUsers = [];
    for (const id of onlineUserIds) {
      const user = await storage.getUser(id);
      if (user) {
        onlineUsers.push({
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          status: 'online'
        });
      }
    }
    
    // Send the list to the client
    ws.send(JSON.stringify({
      type: 'online_users',
      data: onlineUsers
    }));
  } catch (error) {
    console.error('Error sending online users:', error);
  }
}