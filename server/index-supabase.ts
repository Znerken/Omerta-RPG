import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { registerRoutes } from './routes-supabase';
import { initializeDatabase, syncSupabaseUsers } from './db-supabase';
import { registerVite } from './vite';

// Initialize Express
const app = express();

// Configure CORS
app.use(cors());

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use user ID + timestamp + random number for unique filenames
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}-${randomNum}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Allow only images
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
    }
  },
});

// Make the uploads directory accessible
app.use('/uploads', express.static(uploadsDir));

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return the file URL
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl });
});

// Initialize database
initializeDatabase()
  .then(() => {
    // Sync Supabase users with our database
    return syncSupabaseUsers();
  })
  .then(() => {
    console.log('Supabase synchronization complete');
  })
  .catch((error) => {
    console.error('Error initializing database:', error);
    process.exit(1);
  });

// Register API routes
const httpServer = registerRoutes(app);

// Configure Vite in development
if (process.env.NODE_ENV !== 'production') {
  registerVite(app);
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Application error:', err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
});

// Catch-all route for SPA
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start the server
const port = process.env.PORT || 5000;

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`serving on port ${port}`);
});