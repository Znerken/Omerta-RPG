import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeDatabase, createTables, syncSupabaseUsers } from './db-supabase';
import { registerRoutes } from './routes-supabase-clean';
import { setupVite } from './vite';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Config route - this must be defined before any auth middleware
app.get('/api/config', (req, res) => {
  res.json({
    VITE_SUPABASE_URL: process.env.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  });
});

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

async function startServer() {
  try {
    // Initialize database
    const dbSuccess = await initializeDatabase();
    if (!dbSuccess) {
      console.error('Failed to initialize database. Exiting...');
      process.exit(1);
    }

    // Create tables if they don't exist
    await createTables();
    
    // Sync Supabase users to game database
    await syncSupabaseUsers();

    // Register API routes and get HTTP server
    const server = await registerRoutes(app);
    
    // Set up development environment if needed
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();