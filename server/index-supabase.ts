import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupSupabaseAuth } from "./auth-supabase";
import { initializeDatabase } from "./db-supabase";
import dotenv from "dotenv";

// Load environment variables from .env file if it exists
dotenv.config();

// Create Express app
const app = express();

// Get directory name (for ES modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? process.env.CORS_ORIGIN || "https://your-production-domain.com" 
    : "http://localhost:3000",
  credentials: true
}));

// Public directories for file uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Set up Supabase auth middleware
setupSupabaseAuth(app);

// Serve Vite app in development
if (process.env.NODE_ENV === 'development') {
  const { createServer: createViteServer } = await import('./vite.js');
  await createViteServer(app);
}

// API routes
const httpServer = await registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

try {
  // Verify database connection
  const dbInitialized = await initializeDatabase();
  
  if (!dbInitialized) {
    console.error("Failed to initialize database. Please check your Supabase configuration.");
    process.exit(1);
  }
  
  // Start the server
  httpServer.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}