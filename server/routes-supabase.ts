import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { setupWebSocketServer } from './websocket-supabase';
import { authProtected, adminProtected } from './auth-supabase';

/**
 * Register all API routes
 * @param app Express app
 * @returns HTTP Server
 */
export function registerRoutes(app: Express): Server {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = setupWebSocketServer(httpServer);
  
  // Add basic health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Add routes that require authentication
  setupAuthenticatedRoutes(app);
  
  // Add admin routes
  setupAdminRoutes(app);
  
  return httpServer;
}

/**
 * Setup routes that require authentication
 * @param app Express app
 */
function setupAuthenticatedRoutes(app: Express) {
  // User profile route
  app.get('/api/user/profile', authProtected, (req, res) => {
    res.json(req.user);
  });
  
  // Update user profile
  app.patch('/api/user/profile', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User stats route
  app.get('/api/user/stats', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User inventory route
  app.get('/api/user/inventory', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User gang route
  app.get('/api/user/gang', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User messages route
  app.get('/api/user/messages', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User friends route
  app.get('/api/user/friends', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User crime history route
  app.get('/api/user/crimes', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User banking route
  app.get('/api/user/banking', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User achievements route
  app.get('/api/user/achievements', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // User challenges route
  app.get('/api/user/challenges', authProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
}

/**
 * Setup admin routes
 * @param app Express app
 */
function setupAdminRoutes(app: Express) {
  // Admin dashboard route
  app.get('/api/admin/dashboard', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin users route
  app.get('/api/admin/users', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin user detail route
  app.get('/api/admin/users/:id', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin user update route
  app.patch('/api/admin/users/:id', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin user ban route
  app.post('/api/admin/users/:id/ban', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin user unban route
  app.post('/api/admin/users/:id/unban', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin game settings route
  app.get('/api/admin/settings', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin game settings update route
  app.patch('/api/admin/settings', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
  
  // Admin statistics route
  app.get('/api/admin/statistics', adminProtected, (req, res) => {
    // TODO: Implement
    res.status(501).json({ message: 'Not implemented yet' });
  });
}