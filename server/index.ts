import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initializeDatabase } from './db-supabase';
import { registerRoutes } from './routes-supabase';
import { setupAuthRoutes } from './auth-supabase';
import { setupVite } from './vite';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Set up middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || true
    : true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'omerta-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Initialize Supabase authentication
setupAuthRoutes(app);

// Initialize the server
async function startServer() {
  try {
    // Initialize database connection
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database connection');
    }

    // Register API routes
    const server = await registerRoutes(app);
    
    // Set up Vite middleware for development
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
      console.log('Vite middleware initialized for development');
    }

    // Start the server
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });

    // Handle cleanup on shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
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