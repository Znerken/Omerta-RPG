import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Configure storage for uploaded files
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: function (req, file, cb) {
    const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Error: Only image files are allowed"));
    }
  },
});

const profileUpdateSchema = z.object({
  bio: z.string().optional(),
  htmlProfile: z.string().optional(),
  profileTheme: z.string().optional(),
  showAchievements: z.boolean().optional(),
});

export function registerProfileRoutes(app: Express) {
  // Get a user's profile
  app.get("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userProfile = await storage.getUserProfile(req.user.id);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      res.json(userProfile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
  // Get a specific user's profile by ID (public view)
  app.get("/api/users/:id/profile", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const userProfile = await storage.getUserProfile(userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Return only public information
      const publicProfile = {
        id: userProfile.id,
        username: userProfile.username,
        level: userProfile.level,
        respect: userProfile.respect,
        avatar: userProfile.avatar,
        bannerImage: userProfile.bannerImage,
        bio: userProfile.bio,
        htmlProfile: userProfile.htmlProfile,
        profileTheme: userProfile.profileTheme,
        isJailed: userProfile.isJailed,
        createdAt: userProfile.createdAt,
        gangId: userProfile.gangId,
        showAchievements: userProfile.showAchievements,
      };
      
      res.json(publicProfile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
  // Update own profile
  app.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = profileUpdateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: result.error.errors 
        });
      }
      
      const updatedProfile = await storage.updateUser(req.user.id, result.data);
      
      if (!updatedProfile) {
        return res.status(500).json({ message: "Failed to update profile" });
      }
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Failed to update profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Upload avatar image
  app.post("/api/user/avatar", isAuthenticated, upload.single("avatar"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Create relative path to the file
      const avatarPath = `/uploads/${req.file.filename}`;
      
      // Update user's avatar in the database
      const updatedUser = await storage.updateUser(req.user.id, { avatar: avatarPath });
      
      if (!updatedUser) {
        // If update fails, remove the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: "Failed to update avatar" });
      }
      
      res.json({ 
        success: true, 
        avatar: avatarPath,
        message: "Avatar uploaded successfully" 
      });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      // If an error occurs, make sure to clean up any uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });
  
  // Upload banner image
  app.post("/api/user/banner", isAuthenticated, upload.single("banner"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Create relative path to the file
      const bannerPath = `/uploads/${req.file.filename}`;
      
      // Update user's banner in the database
      const updatedUser = await storage.updateUser(req.user.id, { bannerImage: bannerPath });
      
      if (!updatedUser) {
        // If update fails, remove the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: "Failed to update banner" });
      }
      
      res.json({ 
        success: true, 
        bannerImage: bannerPath,
        message: "Banner uploaded successfully" 
      });
    } catch (error) {
      console.error("Failed to upload banner:", error);
      // If an error occurs, make sure to clean up any uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });
  
  // Get user's achievements with unlocked status
  app.get("/api/user/achievements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAchievementsWithUnlocked(req.user.id);
      res.json(achievements);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  // Get another user's achievements
  app.get("/api/users/:id/achievements", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Get the user first to check if they show achievements
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If user has opted out of showing achievements, return a message
      if (user.showAchievements === false) {
        return res.json({ 
          hidden: true,
          message: "This user has chosen to hide their achievements" 
        });
      }
      
      // Get achievements for this user
      const achievements = await storage.getAchievementsWithUnlocked(userId);
      
      // Filter out hidden achievements that haven't been unlocked yet
      const filteredAchievements = achievements.filter(achievement => 
        !achievement.hidden || achievement.unlocked
      );
      
      res.json(filteredAchievements);
    } catch (error) {
      console.error("Failed to fetch user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });
}