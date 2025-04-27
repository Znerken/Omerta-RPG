import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { supabase, db } from './db-supabase';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from './storage-supabase-clean';
import jwt from 'jsonwebtoken';

// Custom WebSocket with user data
interface MafiaWebSocket extends WebSocket {
  userId?: number;
  username?: string;
  isAlive: boolean;
  lastMessageTime: number;
}

// Store active connections by user ID
const clientsByUserId = new Map<number, MafiaWebSocket>();
// Store all active connections
const allClients = new Set<MafiaWebSocket>();

// Verify Supabase JWT token
async function verifyToken(token: string): Promise<any> {
  try {
    // Use Supabase to verify the token
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Token verification failed:', error?.message);
      return null;
    }
    
    // Get the game user associated with this Supabase user
    const gameUser = await storage.getUserBySupabaseId(data.user.id);
    
    if (!gameUser) {
      console.error('No game user found for Supabase ID:', data.user.id);
      return null;
    }
    
    return gameUser;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Handle new connection
async function handleConnection(ws: MafiaWebSocket, request: any) {
  ws.isAlive = true;
  ws.lastMessageTime = Date.now();
  
  // Add to all clients set
  allClients.add(ws);
  
  // Extract token from URL query (?token=xyz)
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (!token) {
    console.log('WebSocket connection attempt without token');
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication token is required'
    }));
    ws.close(1008, 'Authentication token is required');
    return;
  }
  
  try {
    // Verify token and get user
    const user = await verifyToken(token);
    
    if (!user) {
      console.log('WebSocket authentication failed: Invalid token');
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication failed'
      }));
      ws.close(1008, 'Authentication failed');
      return;
    }
    
    // Attach user info to socket
    ws.userId = user.id;
    ws.username = user.username;
    
    // Update user's status to online
    await storage.updateUserStatus(user.id, 'online');
    
    // Store connection in map
    if (clientsByUserId.has(user.id)) {
      // If user already has a connection, close it
      const existingConnection = clientsByUserId.get(user.id);
      if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
        existingConnection.send(JSON.stringify({
          type: 'disconnect',
          message: 'Connected from another device/browser'
        }));
        existingConnection.close(1000, 'Connected from another device/browser');
      }
    }
    
    clientsByUserId.set(user.id, ws);
    
    console.log(`WebSocket connection established for user ${user.username} (ID: ${user.id})`);
    
    // Send welcome message to client
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Successfully connected to the game server',
      userId: user.id,
      username: user.username
    }));
    
    // Broadcast user online status to friends
    broadcastToFriends(user.id, {
      type: 'user_status',
      userId: user.id,
      username: user.username,
      status: 'online',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error handling WebSocket connection:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Error establishing connection'
    }));
    ws.close(1011, 'Server error');
  }
}

// Send message to a specific user
function sendToUser(userId: number, message: any) {
  const client = clientsByUserId.get(userId);
  
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
    return true;
  }
  
  return false;
}

// Broadcast message to all friends of a user
async function broadcastToFriends(userId: number, message: any) {
  try {
    const friends = await storage.getFriends(userId);
    
    for (const friend of friends) {
      sendToUser(friend.id, message);
    }
  } catch (error) {
    console.error('Error broadcasting to friends:', error);
  }
}

// Broadcast message to all online users
function broadcastToAll(message: any) {
  for (const client of allClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

// Handle incoming messages
async function handleMessage(ws: MafiaWebSocket, data: Buffer) {
  try {
    const message = JSON.parse(data.toString());
    ws.lastMessageTime = Date.now();
    
    // Make sure user is authenticated
    if (!ws.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }));
      return;
    }
    
    console.log(`Received message from ${ws.username} (${ws.userId}):`, message.type);
    
    switch (message.type) {
      case 'ping':
        // Respond to ping
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        break;
        
      case 'direct_message':
        // Handle direct message
        if (!message.receiverId || !message.content) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format. receiverId and content are required.'
          }));
          return;
        }
        
        // Store message in database
        const savedMessage = await storage.sendMessage(ws.userId, message.content, {
          receiverId: message.receiverId,
          type: 'direct'
        });
        
        // Send message to receiver if online
        sendToUser(message.receiverId, {
          type: 'direct_message',
          message: savedMessage,
          sender: {
            id: ws.userId,
            username: ws.username
          }
        });
        
        // Send confirmation to sender
        ws.send(JSON.stringify({
          type: 'message_sent',
          messageId: savedMessage.id
        }));
        break;
        
      case 'gang_message':
        // Handle gang message
        if (!message.gangId || !message.content) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format. gangId and content are required.'
          }));
          return;
        }
        
        // Check if user is in the gang
        const userGang = await storage.getUserGang(ws.userId);
        
        if (!userGang || userGang.id !== message.gangId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'You are not a member of this gang'
          }));
          return;
        }
        
        // Store message in database
        const gangMessage = await storage.sendMessage(ws.userId, message.content, {
          gangId: message.gangId,
          type: 'gang'
        });
        
        // Send message to all gang members
        for (const member of userGang.members) {
          sendToUser(member.userId, {
            type: 'gang_message',
            message: gangMessage,
            sender: {
              id: ws.userId,
              username: ws.username
            },
            gangId: message.gangId,
            gangName: userGang.name
          });
        }
        break;
        
      case 'status_update':
        // Handle status update
        if (!message.status) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format. status is required.'
          }));
          return;
        }
        
        // Update user status
        await storage.updateUserStatus(ws.userId, message.status);
        
        // Broadcast status update to friends
        broadcastToFriends(ws.userId, {
          type: 'user_status',
          userId: ws.userId,
          username: ws.username,
          status: message.status,
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${message.type}`
        }));
    }
  } catch (error) {
    console.error('Error handling message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process message'
    }));
  }
}

// Handle client disconnect
async function handleClose(ws: MafiaWebSocket) {
  try {
    if (ws.userId) {
      console.log(`WebSocket connection closed for user ${ws.username} (ID: ${ws.userId})`);
      
      // Remove from maps
      clientsByUserId.delete(ws.userId);
      allClients.delete(ws);
      
      // Update user status to offline
      await storage.updateUserStatus(ws.userId, 'offline');
      
      // Broadcast to friends
      broadcastToFriends(ws.userId, {
        type: 'user_status',
        userId: ws.userId,
        username: ws.username,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    } else {
      allClients.delete(ws);
    }
  } catch (error) {
    console.error('Error handling close:', error);
  }
}

// Setup heartbeat to detect dead connections
function setupHeartbeat(wss: WebSocketServer) {
  const interval = setInterval(() => {
    for (const client of allClients) {
      if (!client.isAlive) {
        client.terminate();
        continue;
      }
      
      // Mark as dead until pong response
      client.isAlive = false;
      client.ping();
      
      // Check for inactivity timeout (30 minutes)
      const inactiveTime = Date.now() - client.lastMessageTime;
      if (inactiveTime > 30 * 60 * 1000) {
        console.log(`Closing inactive connection for user ${client.username || 'unknown'}`);
        client.close(1000, 'Inactive connection');
      }
    }
  }, 30000); // Check every 30 seconds
  
  wss.on('close', () => {
    clearInterval(interval);
  });
}

// Register WebSocket server with HTTP server
export function registerWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws: MafiaWebSocket, request) => {
    handleConnection(ws, request);
    
    ws.on('message', (data: Buffer) => {
      handleMessage(ws, data);
    });
    
    ws.on('close', () => {
      handleClose(ws);
    });
    
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastMessageTime = Date.now();
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  setupHeartbeat(wss);
  
  console.log('WebSocket server initialized');
  return wss;
}