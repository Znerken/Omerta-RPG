import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupWebSockets, notifyUser, broadcast } from "./websocket-supabase";
import { isAuthenticated, isAdmin } from "./auth-supabase";
import { registerProfileRoutes } from "./profile-routes";
import { registerAdminRoutes } from "./admin-routes";
import { registerSocialRoutes } from "./social-routes";
import { registerCasinoRoutes } from "./casino-routes";
import { registerBankingRoutes } from "./banking-routes";
import { registerDrugRoutes } from "./drug-routes";
import { registerAchievementRoutes } from "./achievement-routes";
import { registerChallengeRoutes } from "./challenge-routes";
import { registerLocationRoutes } from "./location-routes";
import { registerGangRoutes } from "./gang-routes";
import { registerDevRoutes } from "./dev-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = setupWebSockets(httpServer);

  // Set up notifyUser function in other modules that need it
  const setNotifyUserFn = (fn: any) => {
    fn(notifyUser);
  };

  // Add custom header to show Supabase integration is active
  app.use((req, res, next) => {
    res.setHeader('X-Using-Supabase', 'true');
    next();
  });

  // Register API routes
  registerProfileRoutes(app);
  registerAdminRoutes(app);
  
  // Social routes with real-time notifications
  try {
    const { setNotifyUserFunction } = await import('./social-routes');
    setNotifyUserFunction(notifyUser);
    registerSocialRoutes(app);
  } catch (error) {
    console.error("Error setting up social routes:", error);
  }
  
  registerCasinoRoutes(app);
  registerBankingRoutes(app);
  registerDrugRoutes(app);
  registerAchievementRoutes(app);
  registerChallengeRoutes(app);
  registerLocationRoutes(app);
  registerGangRoutes(app);
  
  // Only register dev routes in development
  if (process.env.NODE_ENV === 'development') {
    registerDevRoutes(app);
  }

  // Status route for health checks
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      environment: process.env.NODE_ENV,
      usingSupabase: true
    });
  });

  // Protected status route that shows authenticated user info
  app.get('/api/status/auth', isAuthenticated, (req, res) => {
    res.json({
      status: 'authenticated',
      user: req.user,
      timestamp: new Date()
    });
  });

  // Admin-only status route
  app.get('/api/status/admin', isAuthenticated, isAdmin, (req, res) => {
    res.json({
      status: 'admin',
      timestamp: new Date()
    });
  });

  return httpServer;
}