import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./middleware/auth";

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

  // Get unviewed achievements
  app.get("/api/achievements/unviewed", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const unviewedAchievements = await storage.getUnviewedAchievements(req.user.id);
      
      // Get full achievement details for each unviewed achievement
      const achievements = [];
      for (const userAchievement of unviewedAchievements) {
        const achievement = await storage.getAchievement(userAchievement.achievementId);
        if (achievement) {
          achievements.push({
            ...achievement,
            unlocked: true,
            unlockedAt: userAchievement.unlockedAt,
            viewed: false
          });
        }
      }
      
      res.json(achievements);
    } catch (error) {
      console.error("Failed to fetch unviewed achievements:", error);
      res.status(500).json({ message: "Failed to fetch unviewed achievements" });
    }
  });

  // Mark achievement as viewed
  app.post("/api/achievements/:id/view", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      const userAchievement = await storage.markAchievementAsViewed(req.user.id, achievementId);
      
      if (!userAchievement) {
        return res.status(404).json({ message: "Achievement not found or not unlocked" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark achievement as viewed:", error);
      res.status(500).json({ message: "Failed to mark achievement as viewed" });
    }
  });

  // Manually unlock achievement (for testing or admin purposes)
  app.post("/api/admin/achievements/:id/unlock", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
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