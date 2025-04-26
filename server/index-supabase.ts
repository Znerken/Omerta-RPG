import express from 'express';
import session from 'express-session';
import path from 'path';
import { initializeDatabase, closeDatabase, syncSupabaseUsers } from './db-supabase';
import { registerRoutes } from './routes-supabase';
import { setupAuthRoutes } from './auth-supabase';
import { storage } from './storage-supabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Validate session secret
if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET environment variable is required');
  process.exit(1);
}

// Enable JSON body parsing
app.use(express.json());

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: storage.sessionStore,
  })
);

// Setup authentication routes
setupAuthRoutes(app);

// Set up API routes
const httpServer = registerRoutes(app);

// Serve static files in production or development
if (process.env.NODE_ENV === 'production') {
  // In production, serve the built client files
  app.use(express.static(path.join(__dirname, '../client')));
} else {
  // In development, use Vite server
  import('./vite').then(({ createViteServer }) => {
    createViteServer();
  });
}

// Default route that will be handled by client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Determine port
const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database, exiting...');
      process.exit(1);
    }

    // Sync Supabase users with database
    await syncSupabaseUsers();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`[express] serving on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Shutdown function
async function shutdown() {
  console.log('Shutting down server...');
  
  // Close database connection
  await closeDatabase();
  
  // Exit process
  process.exit(0);
}

// Start server
startServer();