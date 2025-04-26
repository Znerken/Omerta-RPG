import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupWebSocketServer } from "./websocket-supabase";
import { setupAuthRoutes } from "./auth-supabase";
import { registerAdminRoutes } from "./admin-routes";
import { registerProfileRoutes } from "./profile-routes";
import { registerSocialRoutes } from "./social-routes";
import { registerBankingRoutes } from "./banking-routes";
import { registerCasinoRoutes } from "./casino-routes";
import { registerDrugRoutes } from "./drug-routes";
import { registerAchievementRoutes } from "./achievement-routes";
import { supabaseClient } from "./supabase";
import { db } from "./db-supabase";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (login, register, etc.)
  setupAuthRoutes(app);

  // Set up admin routes
  registerAdminRoutes(app);

  // Set up profile routes
  registerProfileRoutes(app);

  // Set up social routes
  registerSocialRoutes(app);

  // Set up banking routes
  registerBankingRoutes(app);

  // Set up casino routes
  registerCasinoRoutes(app);

  // Set up drug routes
  registerDrugRoutes(app);

  // Set up achievement routes
  registerAchievementRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = setupWebSocketServer(httpServer);

  // Create message notification function for social routes
  function notifyUser(userId: number, type: string, data: any) {
    // Find client with matching userId
    for (const client of wss.clients) {
      if (client._userId === userId && client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({ type, data }));
        break;
      }
    }
  }

  // Create broadcast function for global notifications
  function broadcast(type: string, data: any) {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({ type, data }));
      }
    });
  }

  // Provide the notifyUser function to social routes
  const socialRoutes = require('./social-routes');
  if (typeof socialRoutes.setNotifyUserFunction === 'function') {
    socialRoutes.setNotifyUserFunction(notifyUser);
  }

  // Endpoint for linking Supabase Auth with existing accounts
  app.post('/api/link-supabase-account', async (req, res) => {
    try {
      const { email, password, supabaseId } = req.body;

      if (!email || !password || !supabaseId) {
        return res.status(400).json({ error: 'Email, password, and supabaseId are required' });
      }

      // Find user by email and password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate password (this would normally be done with a hash comparison)
      // For simplicity, we're just comparing directly, but in reality use bcrypt or similar
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.supabaseId) {
        return res.status(409).json({ error: 'User already linked to a Supabase account' });
      }

      // Link Supabase ID to user
      const [updatedUser] = await db
        .update(users)
        .set({ supabaseId })
        .where(eq(users.id, user.id))
        .returning();

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error linking Supabase account:', error);
      res.status(500).json({ error: 'Failed to link Supabase account' });
    }
  });

  return httpServer;
}