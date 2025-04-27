import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { initializeDatabase, createTables, syncSupabaseUsers } from './db-supabase';
import { registerRoutes } from './routes-supabase';
import { setupAuthRoutes } from './auth-supabase';
import { storage } from './storage-supabase';
import { createWebSocketServer } from './websocket-supabase';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Base middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory for user files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Main entry point
async function main() {
  try {
    // Initialize database
    console.log('Initializing database connection...');
    const dbConnected = await initializeDatabase();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting.');
      process.exit(1);
    }

    // Create tables if they don't exist
    console.log('Ensuring database tables exist...');
    await createTables();

    // Sync users from Supabase Auth
    console.log('Synchronizing users from Supabase Auth...');
    await syncSupabaseUsers();

    // Set up authentication routes
    console.log('Setting up authentication routes...');
    setupAuthRoutes(app);

    // Register API routes
    console.log('Registering API routes...');
    const httpServer = await registerRoutes(app);

    // Set up WebSocket server
    console.log('Setting up WebSocket server...');
    createWebSocketServer(httpServer);

    // Determine port
    const PORT = process.env.PORT || 5000;

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`[express] serving on port ${PORT}`);
    });

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      httpServer.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(console.error);