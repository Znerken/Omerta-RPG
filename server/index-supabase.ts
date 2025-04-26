import express, { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { viteNodeApp } from './vite';
import { registerRoutes } from './routes-supabase';
import { initializeDatabase } from './db-supabase';

// Load environment variables
dotenv.config();

// Print environment for debugging
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Create Express app
const app = express();

// Configure middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Serve static files for asset files
app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

// Initialize database
initializeDatabase()
  .then((success) => {
    if (!success) {
      console.error('Failed to initialize database, exiting...');
      process.exit(1);
    }

    // In development mode, use Vite's dev server
    if (process.env.NODE_ENV === 'development') {
      app.use(viteNodeApp);
    } else {
      // In production, serve built client files
      app.use(express.static(path.resolve(process.cwd(), 'dist/client')));
      
      // For any GET request that doesn't match an API or static file, serve the index.html
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(process.cwd(), 'dist/client/index.html'));
      });
    }

    // Register API routes & WebSocket
    registerRoutes(app)
      .then((server) => {
        // Get port from environment or use default
        const PORT = process.env.PORT || 5000;

        // Start the server
        server.listen(PORT, '0.0.0.0', () => {
          console.log(`[express] serving on port ${PORT}`);
        });
      })
      .catch((err) => {
        console.error('Failed to register routes:', err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error('Error during initialization:', err);
    process.exit(1);
  });

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});