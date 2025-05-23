import { Express, Request, Response } from "express";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import sanitizeHtml from "sanitize-html";
import { isAuthenticated } from "./middleware/auth";
import { fileURLToPath } from "url";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "../client/public/uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

// Create upload middleware with size limits
const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB max size
  },
  fileFilter: function(req, file, cb) {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  }
});

// HTML sanitizer configuration
const sanitizeOptions = {
  allowedTags: [ 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span'
  ],
  allowedAttributes: {
    a: [ 'href', 'name', 'target' ],
    img: [ 'src', 'alt', 'width', 'height' ],
    div: [ 'style', 'class' ],
    span: [ 'style', 'class' ],
    p: [ 'style', 'class' ],
    h1: [ 'style', 'class' ],
    h2: [ 'style', 'class' ],
    h3: [ 'style', 'class' ],
    h4: [ 'style', 'class' ],
    h5: [ 'style', 'class' ],
    h6: [ 'style', 'class' ],
  },
  // Restrict URLs to HTTP, HTTPS, and relative paths
  allowedSchemes: [ 'http', 'https', 'ftp', 'mailto', 'tel' ]
};

export function registerProfileRoutes(app: Express) {
  // Get user profile
  app.get("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // EMERGENCY TEST ROUTE - ultra simple with no schema dependencies
  app.get("/api/users/:id/simple-profile", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Log each step for detailed debugging
      console.log(`[PROFILE DEBUG] START - Simple profile lookup for user ID ${userId}`);
      
      try {
        // Use direct database query to get the most basic data
        console.log(`[PROFILE DEBUG] Executing direct SQL query for user ${userId}`);
        
        // Check if the user exists at all first
        const checkResult = await db.execute(sql`
          SELECT id, username FROM users WHERE id = ${userId} LIMIT 1
        `);
        
        console.log(`[PROFILE DEBUG] User check query returned ${checkResult.rows.length} results`);
        console.log("[PROFILE DEBUG] Check result:", JSON.stringify(checkResult.rows, null, 2));
        
        if (checkResult.rows.length === 0) {
          console.log(`[PROFILE DEBUG] User with ID ${userId} not found in database`);
          return res.status(404).json({ 
            success: false, 
            message: "User not found",
            userId 
          });
        }
        
        // Now get all user data
        const fullResult = await db.execute(sql`
          SELECT * FROM users WHERE id = ${userId}
        `);
        
        const userData = fullResult.rows[0];
        console.log(`[PROFILE DEBUG] Full user data retrieved for ${userData.username}`);
        
        const response = {
          success: true,
          user: userData,
          timestamp: new Date().toISOString()
        };
        
        // Log the exact response for troubleshooting
        console.log("[PROFILE DEBUG] Sending response:", JSON.stringify(response, null, 2));
        
        return res.json(response);
      } catch (dbError) {
        console.error("[PROFILE DEBUG] Database error:", dbError);
        return res.status(500).json({ 
          success: false,
          message: "Database error",
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }
    } catch (error) {
      console.error("[PROFILE DEBUG] Unexpected error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch profile",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Standard profile route - keep the original but very simplified
  app.get("/api/users/:id/profile", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`Simple profile lookup for user ID ${userId}`);
      
      // Test with a basic query first
      const userResult = await db.execute(
        sql`SELECT * FROM users WHERE id = ${userId}`
      );
      
      console.log(`Query completed with ${userResult.rows.length} results for user ID ${userId}`);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Manual field mapping instead of transformations
      const user = userResult.rows[0];
      const profile = {
        id: user.id,
        username: user.username,
        level: user.level || 1,
        xp: user.xp || 0,
        cash: user.cash || 0,
        respect: user.respect || 0,
        avatar: user.avatar,
        bannerImage: user.banner_image,
        bio: user.bio,
        htmlProfile: user.html_profile,
        profileTheme: user.profile_theme,
        showAchievements: user.show_achievements !== false,
        isJailed: user.is_jailed || false,
        jailTimeEnd: user.jail_time_end,
        createdAt: user.created_at,
        inGang: false // No gangs for simplicity
      };
      
      console.log(`Returning standard profile for ${profile.username}`);
      return res.json(profile);
      
    } catch (error) {
      console.error("Error in simple profile lookup:", error);
      return res.status(500).json({ 
        message: "Failed to fetch profile",
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { bio, htmlProfile, profileTheme, showAchievements } = req.body;
      
      // Sanitize HTML content
      let sanitizedHtml = null;
      if (htmlProfile) {
        sanitizedHtml = sanitizeHtml(htmlProfile, sanitizeOptions);
      }
      
      // Update profile
      const updatedUser = await storage.updateUser(userId, {
        bio: bio || null,
        htmlProfile: sanitizedHtml,
        profileTheme: profileTheme || null,
        showAchievements: showAchievements !== undefined ? showAchievements : true
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload avatar
  app.post("/api/user/avatar", isAuthenticated, upload.single("avatar"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.user.id;
      const avatarPath = `/uploads/${req.file.filename}`;
      
      // Update user with new avatar
      const updatedUser = await storage.updateUser(userId, {
        avatar: avatarPath
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ avatar: avatarPath });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Upload banner
  app.post("/api/user/banner", isAuthenticated, upload.single("banner"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.user.id;
      const bannerPath = `/uploads/${req.file.filename}`;
      
      // Update user with new banner
      const updatedUser = await storage.updateUser(userId, {
        bannerImage: bannerPath
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ bannerImage: bannerPath });
    } catch (error) {
      console.error("Error uploading banner:", error);
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });

  // Get user achievements
  app.get("/api/user/achievements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const achievements = await storage.getAchievementsWithUnlocked(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get another user's achievements
  app.get("/api/users/:id/achievements", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // First check if user allows others to see achievements
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.showAchievements === false) {
        return res.status(403).json({ message: "This user has hidden their achievements" });
      }
      
      const achievements = await storage.getAchievementsWithUnlocked(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
}