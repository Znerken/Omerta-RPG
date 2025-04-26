import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./middleware/auth";
import { InsertAchievement } from "@shared/schema";
import { z } from "zod";

// Validate achievement progress update
const progressUpdateSchema = z.object({
  value: z.number().positive(),
});

export function registerAchievementRoutes(app: Express) {
  // Get all achievements with unlocked status for the authenticated user
  app.get("/api/achievements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAchievementsWithUnlocked(req.user.id);
      res.json(achievements);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get achievements by category
  app.get("/api/achievements/category/:category", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const allAchievements = await storage.getAchievementsWithUnlocked(req.user.id);
      const filteredAchievements = allAchievements.filter(achievement => achievement.category === category);
      res.json(filteredAchievements);
    } catch (error) {
      console.error("Failed to fetch achievements by category:", error);
      res.status(500).json({ message: "Failed to fetch achievements by category" });
    }
  });

  // Get achievements by series
  app.get("/api/achievements/series/:series", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const series = req.params.series;
      const allAchievements = await storage.getAchievementsWithUnlocked(req.user.id);
      const filteredAchievements = allAchievements
        .filter(achievement => achievement.series === series)
        .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
      
      res.json(filteredAchievements);
    } catch (error) {
      console.error("Failed to fetch achievements by series:", error);
      res.status(500).json({ message: "Failed to fetch achievements by series" });
    }
  });

  // Get achievements by difficulty
  app.get("/api/achievements/difficulty/:difficulty", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const difficulty = req.params.difficulty;
      const allAchievements = await storage.getAchievementsWithUnlocked(req.user.id);
      const filteredAchievements = allAchievements.filter(achievement => achievement.difficulty === difficulty);
      
      res.json(filteredAchievements);
    } catch (error) {
      console.error("Failed to fetch achievements by difficulty:", error);
      res.status(500).json({ message: "Failed to fetch achievements by difficulty" });
    }
  });

  // Get unviewed achievements
  app.get("/api/achievements/unviewed", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const unviewedAchievements = await storage.getUnviewedAchievements(req.user.id);
      res.json(unviewedAchievements);
    } catch (error) {
      console.error("Failed to fetch unviewed achievements:", error);
      res.status(500).json({ message: "Failed to fetch unviewed achievements" });
    }
  });

  // Get achievement progress
  app.get("/api/achievements/:id/progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      const progress = await storage.getAchievementProgress(req.user.id, achievementId);
      
      if (!progress) {
        return res.status(404).json({ message: "Progress not found" });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Failed to fetch achievement progress:", error);
      res.status(500).json({ message: "Failed to fetch achievement progress" });
    }
  });

  // Mark achievement as viewed
  app.post("/api/achievements/:id/view", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      const success = await storage.markAchievementAsViewed(req.user.id, achievementId);
      
      if (!success) {
        return res.status(404).json({ message: "Achievement not found or not unlocked" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark achievement as viewed:", error);
      res.status(500).json({ message: "Failed to mark achievement as viewed" });
    }
  });

  // Claim achievement rewards
  app.post("/api/achievements/:id/claim", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      const success = await storage.claimAchievementRewards(req.user.id, achievementId);
      
      if (!success) {
        return res.status(404).json({ 
          message: "Achievement not found, not unlocked, or rewards already claimed" 
        });
      }
      
      // Get updated user data
      const user = await storage.getUser(req.user.id);
      
      res.json({ 
        success: true,
        user 
      });
    } catch (error) {
      console.error("Failed to claim achievement rewards:", error);
      res.status(500).json({ message: "Failed to claim achievement rewards" });
    }
  });

  // Update achievement progress manually (for testing)
  app.post("/api/achievements/:id/update-progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validation = progressUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.format() });
      }
      
      const achievementId = parseInt(req.params.id);
      const { value } = validation.data;
      
      const progress = await storage.updateAchievementProgress(req.user.id, achievementId, value);
      
      // Check if achievement should be unlocked
      const achievement = await storage.getAchievement(achievementId);
      if (achievement && progress.currentValue >= achievement.requirementValue) {
        await storage.unlockAchievement(req.user.id, achievementId);
      }
      
      res.json({ success: true, progress });
    } catch (error) {
      console.error("Failed to update achievement progress:", error);
      res.status(500).json({ message: "Failed to update achievement progress" });
    }
  });

  // Check achievements for a specific action type
  app.post("/api/achievements/check", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { type, target, value } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Action type is required" });
      }
      
      const unlockedAchievements = await storage.checkAndUpdateAchievementProgress(
        req.user.id, 
        type, 
        target, 
        value
      );
      
      res.json({ 
        success: true, 
        unlockedAchievements,
        count: unlockedAchievements.length
      });
    } catch (error) {
      console.error("Failed to check achievements:", error);
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  // ADMIN ROUTES

  // Get all achievements (admin)
  app.get("/api/admin/achievements", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const allAchievements = await storage.getAchievementsWithUnlocked(req.user.id);
      res.json(allAchievements);
    } catch (error) {
      console.error("Failed to fetch all achievements:", error);
      res.status(500).json({ message: "Failed to fetch all achievements" });
    }
  });

  // Create a new achievement (admin)
  app.post("/api/admin/achievements", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const achievementData: InsertAchievement = req.body;
      
      // Validate required fields (just a simple check)
      if (!achievementData.name || !achievementData.description || !achievementData.category || 
          !achievementData.requirementType || achievementData.requirementValue === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Failed to create achievement:", error);
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  // Update an achievement (admin)
  app.patch("/api/admin/achievements/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      const achievementData = req.body;
      
      const achievement = await storage.updateAchievement(achievementId, achievementData);
      
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error("Failed to update achievement:", error);
      res.status(500).json({ message: "Failed to update achievement" });
    }
  });

  // Delete an achievement (admin)
  app.delete("/api/admin/achievements/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      const success = await storage.deleteAchievement(achievementId);
      
      if (!success) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete achievement:", error);
      res.status(500).json({ message: "Failed to delete achievement" });
    }
  });

  // Manually unlock achievement (admin)
  app.post("/api/admin/achievements/:id/unlock", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      const userId = parseInt(req.body.userId || req.user.id);
      
      const userAchievement = await storage.unlockAchievement(userId, achievementId);
      
      if (!userAchievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      const achievement = await storage.getAchievement(achievementId);
      
      res.json({
        success: true,
        achievement,
        unlocked: true,
        unlockedAt: userAchievement.unlockedAt,
        viewed: userAchievement.viewed
      });
    } catch (error) {
      console.error("Failed to unlock achievement:", error);
      res.status(500).json({ message: "Failed to unlock achievement" });
    }
  });
}