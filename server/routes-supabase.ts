import { Express, Request, Response } from 'express';
import { Server, createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuthRoutes, authProtected, adminProtected } from './auth-supabase';
import { registerAdminRoutes } from './admin-routes';
import { registerAchievementRoutes } from './achievement-routes';
import { registerCasinoRoutes } from './casino-routes';
import { registerBankingRoutes } from './banking-routes';
import { registerDevRoutes } from './dev-routes';
import { registerDrugRoutes } from './drug-routes';
// Import other route registers as needed
import { supabaseAdmin } from './supabase';

// Map to store WebSocket connections by user ID
const userSockets = new Map<number, Set<WebSocket>>();

/**
 * Register all API routes
 * @param app Express app
 */
export function registerRoutes(app: Express): Server {
  // Setup auth routes first
  setupAuthRoutes(app);
  
  // Register feature routes
  registerAdminRoutes(app);
  registerAchievementRoutes(app);
  registerCasinoRoutes(app);
  registerBankingRoutes(app);
  registerDevRoutes(app);
  registerDrugRoutes(app);
  // Register other routes
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handler
  wss.on('connection', (socket: WebSocket, req: Request) => {
    console.log('WebSocket connection established');
    
    // Extract token from URL query
    const url = new URL(`http://localhost${req.url}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('No token provided, closing connection');
      socket.close(1008, 'Authentication required');
      return;
    }
    
    // Authenticate user
    authenticateUser(socket, token);
    
    // Handle socket events
    socket.on('message', (message: string) => {
      handleSocketMessage(socket, message);
    });
    
    socket.on('close', () => {
      console.log(`WebSocket closed for user ID: ${(socket as any)._userId}`);
      removeUserSocket(socket);
    });
    
    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });
  
  return httpServer;
}

/**
 * Authenticate a WebSocket connection
 */
async function authenticateUser(socket: WebSocket, token: string) {
  try {
    // Verify token with Supabase
    const supabaseUser = await supabaseAdmin.auth.getUser(token);
    
    if (supabaseUser.error || !supabaseUser.data.user) {
      console.error('Invalid token:', supabaseUser.error);
      socket.close(1008, 'Invalid authentication token');
      return;
    }
    
    // Get game user ID from Supabase user
    const userId = supabaseUser.data.user.user_metadata?.game_user_id;
    
    if (!userId) {
      console.error('No game user ID found in Supabase user metadata');
      socket.close(1008, 'User not linked to game account');
      return;
    }
    
    // Store user ID on socket
    (socket as any)._userId = userId;
    (socket as any)._lastActivity = Date.now();
    
    // Add socket to user's socket set
    addUserSocket(userId, socket);
    
    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connection_established',
      userId,
      timestamp: new Date().toISOString(),
    }));
    
    console.log(`WebSocket authenticated for user ID: ${userId}`);
  } catch (error) {
    console.error('Authentication error:', error);
    socket.close(1008, 'Authentication failed');
  }
}

/**
 * Add a socket to a user's socket set
 */
function addUserSocket(userId: number, socket: WebSocket) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  
  userSockets.get(userId)!.add(socket);
}

/**
 * Remove a socket from its user's socket set
 */
function removeUserSocket(socket: WebSocket) {
  const userId = (socket as any)._userId;
  
  if (!userId || !userSockets.has(userId)) {
    return;
  }
  
  const sockets = userSockets.get(userId)!;
  sockets.delete(socket);
  
  if (sockets.size === 0) {
    userSockets.delete(userId);
  }
}

/**
 * Handle a message from a WebSocket
 */
function handleSocketMessage(socket: WebSocket, message: string) {
  try {
    const userId = (socket as any)._userId;
    
    if (!userId) {
      console.warn('Received message from unauthenticated socket');
      return;
    }
    
    // Update last activity timestamp
    (socket as any)._lastActivity = Date.now();
    
    // Parse message
    const data = JSON.parse(message);
    
    console.log(`Received message from user ${userId}:`, data);
    
    // Handle different message types
    switch (data.type) {
      case 'ping':
        socket.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString(),
        }));
        break;
        
      // Handle other message types here
        
      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
  } catch (error) {
    console.error('Error handling socket message:', error);
  }
}

/**
 * Send a message to a specific user via WebSocket
 */
export function sendToUser(userId: number, data: any) {
  if (!userSockets.has(userId)) {
    return false;
  }
  
  const message = JSON.stringify(data);
  const sockets = userSockets.get(userId)!;
  
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
  
  return true;
}

/**
 * Broadcast a message to all connected users
 */
export function broadcast(data: any, excludeUser?: number) {
  const message = JSON.stringify(data);
  
  for (const [userId, sockets] of userSockets) {
    if (excludeUser && userId === excludeUser) {
      continue;
    }
    
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
}