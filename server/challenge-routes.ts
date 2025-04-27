import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { isAuthenticated } from "./middleware/auth";
import { isAdmin } from "./middleware/admin";

const router = express.Router();

// Get all active challenges for the current user
router.get("/challenges", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const challenges = await storage.getChallengesWithProgress(req.user.id);
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

// Update challenge progress for a specific challenge
router.post("/challenges/:id/progress", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const challengeId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Validate request body
    const schema = z.object({
      claimed: z.boolean().optional(),
      currentValue: z.number().optional(),
    });
    
    const validatedData = schema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: "Invalid request data" });
    }
    
    const { claimed, currentValue } = validatedData.data;
    
    // Get the challenge and current progress
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    // Check if the challenge is active
    const now = new Date();
    if (challenge.startDate > now || (challenge.endDate && challenge.endDate < now)) {
      return res.status(400).json({ error: "Challenge is not active" });
    }
    
    // Get current progress
    let progress = await storage.getChallengeProgress(userId, challengeId);
    
    // If no progress record exists, create one
    if (!progress) {
      progress = await storage.createChallengeProgress({
        userId,
        challengeId,
        currentValue: 0,
        completed: false,
        claimed: false
      });
    }
    
    // If challenge is completed and user is claiming rewards
    if (claimed && progress.completed && !progress.claimed) {
      // Create a record of the reward
      const reward = await storage.createChallengeReward({
        userId,
        challengeId,
        cashReward: challenge.cashReward,
        xpReward: challenge.xpReward,
        respectReward: challenge.respectReward,
        itemId: challenge.itemReward > 0 ? challenge.itemReward : null
      });
      
      // Update user with rewards
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, {
          cash: user.cash + challenge.cashReward,
          xp: user.xp + challenge.xpReward,
          respect: user.respect + challenge.respectReward
        });
        
        // Add item to inventory if there is an item reward
        if (challenge.itemReward > 0) {
          await storage.addItemToInventory({
            userId,
            itemId: challenge.itemReward,
            quantity: 1,
            equipped: false
          });
        }
      }
      
      // Mark progress as claimed
      await storage.updateChallengeProgress(userId, challengeId, { claimed: true });
      
      return res.json({ 
        success: true, 
        message: "Reward claimed successfully", 
        reward 
      });
    }
    
    // If updating current value
    if (currentValue !== undefined && !progress.completed) {
      // Check if the challenge is completed with this update
      const completed = currentValue >= challenge.targetValue;
      
      // Update the progress
      const updatedProgress = await storage.updateChallengeProgress(userId, challengeId, { 
        currentValue, 
        completed 
      });
      
      return res.json({ 
        success: true, 
        progress: updatedProgress,
        completed
      });
    }
    
    // If no changes were made
    return res.json({ 
      success: false, 
      message: "No changes made to challenge progress",
      progress
    });
    
  } catch (error) {
    console.error("Error updating challenge progress:", error);
    res.status(500).json({ error: "Failed to update challenge progress" });
  }
});

// Admin routes for managing challenges
router.get("/admin/challenges", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const challenges = await storage.getAllChallenges();
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

router.post("/admin/challenges", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const schema = z.object({
      name: z.string(),
      description: z.string(),
      type: z.string(),
      targetValue: z.number().min(1),
      startDate: z.string().transform(str => new Date(str)),
      endDate: z.string().transform(str => new Date(str)).optional(),
      cashReward: z.number().min(0),
      xpReward: z.number().min(0),
      respectReward: z.number().min(0),
      itemReward: z.number().min(0)
    });
    
    const validatedData = schema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: "Invalid challenge data", details: validatedData.error });
    }
    
    const challenge = await storage.createChallenge(validatedData.data);
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

router.patch("/admin/challenges/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const challengeId = parseInt(req.params.id);
    
    // Validate request body
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      type: z.string().optional(),
      targetValue: z.number().min(1).optional(),
      startDate: z.string().transform(str => new Date(str)).optional(),
      endDate: z.string().transform(str => new Date(str)).optional().nullable(),
      cashReward: z.number().min(0).optional(),
      xpReward: z.number().min(0).optional(),
      respectReward: z.number().min(0).optional(),
      itemReward: z.number().min(0).optional()
    });
    
    const validatedData = schema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: "Invalid challenge data", details: validatedData.error });
    }
    
    const challenge = await storage.updateChallenge(challengeId, validatedData.data);
    
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: "Failed to update challenge" });
  }
});

router.delete("/admin/challenges/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const challengeId = parseInt(req.params.id);
    const success = await storage.deleteChallenge(challengeId);
    
    if (!success) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete challenge" });
  }
});

export default router;