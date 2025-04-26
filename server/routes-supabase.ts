import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { registerAchievementRoutes } from './achievement-routes';
import { registerAdminRoutes } from './admin-routes';
import { registerBankingRoutes } from './banking-routes';
import { registerCasinoRoutes } from './casino-routes';
import { registerDrugRoutes } from './drug-routes';
import { registerProfileRoutes } from './profile-routes';
import { registerDevRoutes } from './dev-routes';
import { registerGangRoutes } from './gang-routes';
import { registerSocialRoutes } from './social-routes';
import { setupAuthRoutes } from './auth-supabase';
import { setupWebSocketServer } from './websocket-supabase';
import { initializeDatabase } from './db-supabase';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initializeDatabase();

  // Set up authentication routes (using Supabase auth)
  setupAuthRoutes(app);

  // Register API routes
  registerAchievementRoutes(app);
  registerAdminRoutes(app);
  registerBankingRoutes(app);
  registerCasinoRoutes(app);
  registerDrugRoutes(app);
  registerProfileRoutes(app);
  registerDevRoutes(app);
  registerGangRoutes(app);
  registerSocialRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = setupWebSocketServer(httpServer);

  // Connected WebSocket clients
  const clients = new Map<number, Set<WebSocket>>();

  // Functions for WebSocket notifications
  function notifyUser(userId: number, type: string, data: any) {
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

  function broadcast(type: string, data: any) {
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

  return httpServer;
}