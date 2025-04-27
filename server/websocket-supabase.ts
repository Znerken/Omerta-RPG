import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { validateAuthHeader } from './supabase';
import { storage } from './storage-supabase';
import { db } from './db-supabase';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// WebSocket client with additional metadata
interface MafiaWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: number;
  username?: string;
  isAdmin?: boolean;
}

// Track connected clients
const clients = new Set<MafiaWebSocket>();
const clientsByUserId = new Map<number, MafiaWebSocket>();

// Create and initialize WebSocket server
export function createWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Set up connection handler
  wss.on('connection', async (ws: WebSocket, request) => {
    const mafiaWs = ws as MafiaWebSocket;
    mafiaWs.isAlive = true;
    
    // Parse URL to get token
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('WebSocket connection attempt without token');
      mafiaWs.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // Validate token
      const supabaseUser = await validateAuthHeader(`Bearer ${token}`);
      if (!supabaseUser) {
        console.log('WebSocket connection with invalid token');
        mafiaWs.close(1008, 'Invalid authentication token');
        return;
      }
      
      // Get user from database
      const user = await storage.getUserBySupabaseId(supabaseUser.id);
      if (!user) {
        console.log('WebSocket connection with valid token but unknown user');
        mafiaWs.close(1008, 'User not found');
        return;
      }
      
      // Set user online
      await db
        .update(users)
        .set({
          status: 'online',
          lastSeen: new Date()
        })
        .where(eq(users.id, user.id));
      
      // Associate user with WebSocket
      mafiaWs.userId = user.id;
      mafiaWs.username = user.username;
      mafiaWs.isAdmin = user.isAdmin;
      
      // Store client reference
      clients.add(mafiaWs);
      clientsByUserId.set(user.id, mafiaWs);
      
      console.log(`WebSocket connection established for user ${user.username} (${user.id})`);
      
      // Notify friends that user is online
      broadcastFriendStatus(user.id, 'online');
      
      // Send welcome message
      mafiaWs.send(JSON.stringify({
        type: 'welcome',
        data: {
          userId: user.id,
          username: user.username
        }
      }));
      
      // Handle incoming messages
      mafiaWs.on('message', (messageData) => {
        try {
          const message = JSON.parse(messageData.toString());
          handleMessage(mafiaWs, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          mafiaWs.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Invalid message format'
            }
          }));
        }
      });
      
      // Handle disconnect
      mafiaWs.on('close', async () => {
        const userId = mafiaWs.userId;
        if (userId) {
          // Set user offline
          await db
            .update(users)
            .set({
              status: 'offline',
              lastSeen: new Date()
            })
            .where(eq(users.id, userId));
          
          // Notify friends that user is offline
          broadcastFriendStatus(userId, 'offline');
          
          // Clean up references
          clientsByUserId.delete(userId);
        }
        
        clients.delete(mafiaWs);
        console.log(`WebSocket connection closed for user ${mafiaWs.username} (${mafiaWs.userId})`);
      });
      
      // Handle pong messages
      mafiaWs.on('pong', () => {
        mafiaWs.isAlive = true;
      });
    } catch (error) {
      console.error('Error handling WebSocket connection:', error);
      mafiaWs.close(1011, 'Server error');
    }
  });
  
  // Set up heartbeat to detect disconnected clients
  const interval = setInterval(() => {
    for (const client of clients) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      
      client.isAlive = false;
      client.ping();
    }
  }, 30000);
  
  // Clean up on server close
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  console.log('WebSocket server initialized');
  return wss;
}

// Handle incoming messages
async function handleMessage(ws: MafiaWebSocket, message: any) {
  if (!ws.userId) {
    return;
  }
  
  const { type, data } = message;
  
  switch (type) {
    case 'heartbeat':
      // Keep connection alive and update last seen
      if (data?.userId === ws.userId) {
        await db
          .update(users)
          .set({
            lastSeen: new Date()
          })
          .where(eq(users.id, ws.userId));
        
        ws.send(JSON.stringify({
          type: 'heartbeat_ack',
          data: { timestamp: new Date().toISOString() }
        }));
      }
      break;
    
    case 'direct_message':
      // Send direct message to another user
      if (data?.recipientId && data?.content) {
        const recipientId = parseInt(data.recipientId, 10);
        if (isNaN(recipientId)) {
          return;
        }
        
        try {
          // Store message in database
          const message = await storage.sendMessage({
            senderId: ws.userId,
            receiverId: recipientId,
            content: data.content,
            type: 'direct',
            timestamp: new Date(),
            read: false
          });
          
          // Deliver message to recipient if online
          const recipientWs = clientsByUserId.get(recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'direct_message',
              data: {
                id: message.id,
                senderId: ws.userId,
                senderUsername: ws.username,
                content: data.content,
                timestamp: message.timestamp
              }
            }));
          }
          
          // Confirm message sent
          ws.send(JSON.stringify({
            type: 'message_sent',
            data: {
              id: message.id,
              recipientId,
              timestamp: message.timestamp
            }
          }));
        } catch (error) {
          console.error('Error sending direct message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Failed to send message'
            }
          }));
        }
      }
      break;
    
    case 'update_status':
      // Update user status
      if (data?.status && ['online', 'away', 'busy', 'offline'].includes(data.status)) {
        try {
          // Update status in database
          await db
            .update(users)
            .set({
              status: data.status
            })
            .where(eq(users.id, ws.userId));
          
          // Notify friends of status change
          broadcastFriendStatus(ws.userId, data.status);
          
          // Confirm status update
          ws.send(JSON.stringify({
            type: 'status_updated',
            data: {
              status: data.status,
              timestamp: new Date().toISOString()
            }
          }));
        } catch (error) {
          console.error('Error updating status:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Failed to update status'
            }
          }));
        }
      }
      break;
    
    case 'mark_message_read':
      // Mark message as read
      if (data?.messageId) {
        const messageId = parseInt(data.messageId, 10);
        if (isNaN(messageId)) {
          return;
        }
        
        try {
          // Update message in database
          const updatedMessage = await storage.markMessageAsRead(messageId);
          
          // Notify sender if online
          const senderWs = clientsByUserId.get(updatedMessage.senderId);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            senderWs.send(JSON.stringify({
              type: 'message_read',
              data: {
                messageId,
                readAt: new Date().toISOString()
              }
            }));
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
      break;
    
    case 'gang_message':
      // Send message to gang
      if (data?.content) {
        try {
          // Get user's gang
          const gang = await storage.getUserGang(ws.userId);
          if (!gang) {
            ws.send(JSON.stringify({
              type: 'error',
              data: {
                message: 'You are not in a gang'
              }
            }));
            return;
          }
          
          // Store message in database
          const message = await storage.sendMessage({
            senderId: ws.userId,
            gangId: gang.id,
            content: data.content,
            type: 'gang',
            timestamp: new Date(),
            read: false
          });
          
          // Broadcast to all gang members
          broadcastGangMessage(gang.id, {
            id: message.id,
            senderId: ws.userId,
            senderUsername: ws.username,
            content: data.content,
            timestamp: message.timestamp,
            gangId: gang.id,
            gangName: gang.name
          });
          
          // Confirm message sent
          ws.send(JSON.stringify({
            type: 'message_sent',
            data: {
              id: message.id,
              gangId: gang.id,
              timestamp: message.timestamp
            }
          }));
        } catch (error) {
          console.error('Error sending gang message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Failed to send message'
            }
          }));
        }
      }
      break;
    
    case 'get_online_friends':
      // Get list of online friends
      try {
        const friends = await storage.getUserFriends(ws.userId);
        const onlineFriends = friends
          .filter(friend => friend.status === 'online' || friend.status === 'away' || friend.status === 'busy')
          .map(friend => ({
            id: friend.id,
            username: friend.username,
            status: friend.status,
            avatar: friend.avatar,
            lastSeen: friend.lastSeen
          }));
        
        ws.send(JSON.stringify({
          type: 'online_friends',
          data: {
            friends: onlineFriends
          }
        }));
      } catch (error) {
        console.error('Error getting online friends:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Failed to get online friends'
          }
        }));
      }
      break;
    
    case 'typing':
      // Send typing indicator to recipient
      if (data?.recipientId) {
        const recipientId = parseInt(data.recipientId, 10);
        if (isNaN(recipientId)) {
          return;
        }
        
        const recipientWs = clientsByUserId.get(recipientId);
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({
            type: 'typing',
            data: {
              senderId: ws.userId,
              senderUsername: ws.username
            }
          }));
        }
      }
      break;
    
    default:
      console.log(`Unknown message type: ${type}`);
  }
}

// Broadcast status update to all friends
async function broadcastFriendStatus(userId: number, status: string) {
  try {
    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      return;
    }
    
    // Get user's friends
    const friends = await storage.getUserFriends(userId);
    
    // Prepare status update message
    const statusMessage = JSON.stringify({
      type: 'friend_status',
      data: {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        status
      }
    });
    
    // Send to each online friend
    for (const friend of friends) {
      const friendWs = clientsByUserId.get(friend.id);
      if (friendWs && friendWs.readyState === WebSocket.OPEN) {
        friendWs.send(statusMessage);
      }
    }
  } catch (error) {
    console.error('Error broadcasting friend status:', error);
  }
}

// Broadcast gang message to all online gang members
async function broadcastGangMessage(gangId: number, messageData: any) {
  try {
    // Prepare gang message
    const gangMessage = JSON.stringify({
      type: 'gang_message',
      data: messageData
    });
    
    // Send to all gang members
    for (const client of clients) {
      if (client.userId && client.readyState === WebSocket.OPEN) {
        // Check if user is in the gang
        const gang = await storage.getUserGang(client.userId);
        if (gang && gang.id === gangId) {
          client.send(gangMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error broadcasting gang message:', error);
  }
}

// Send message to specific user
export function sendToUser(userId: number, type: string, data: any) {
  const client = clientsByUserId.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({
      type,
      data
    }));
    return true;
  }
  return false;
}

// Broadcast message to all connected clients
export function broadcast(type: string, data: any, exceptUserId?: number) {
  const message = JSON.stringify({
    type,
    data
  });
  
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN && (!exceptUserId || client.userId !== exceptUserId)) {
      client.send(message);
    }
  }
}

// Broadcast message to all admin users
export function broadcastToAdmins(type: string, data: any) {
  const message = JSON.stringify({
    type,
    data
  });
  
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN && client.isAdmin) {
      client.send(message);
    }
  }
}

// Get count of online users
export function getOnlineCount(): number {
  return clients.size;
}