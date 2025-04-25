import { Router } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertChallengeProgressSchema, insertChallengeRewardSchema, insertChallengeSchema } from "@shared/schema";
import { isAdmin, isAuthenticated } from "./middleware/auth";

const router = Router();

// Get all active challenges with user progress
router.get("/challenges", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const challenges = await storage.getChallengesWithProgress(userId);
    res.json(challenges);
  } catch (error: any) {
    console.error("Error getting challenges:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific challenge with user progress
router.get("/challenges/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ error: "Invalid challenge ID" });
    }
    
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    const progress = await storage.getChallengeProgress(userId, challengeId);
    
    res.json({
      ...challenge,
      progress,
      completed: progress?.completed || false,
      claimed: progress?.claimed || false,
      currentValue: progress?.currentValue || 0
    });
  } catch (error: any) {
    console.error("Error getting challenge:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update progress for a challenge
router.post("/challenges/:id/progress", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ error: "Invalid challenge ID" });
    }
    
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    const updateSchema = z.object({
      currentValue: z.number().optional(),
      completed: z.boolean().optional(),
      claimed: z.boolean().optional()
    });
    
    const validatedData = updateSchema.parse(req.body);
    
    let progress = await storage.getChallengeProgress(userId, challengeId);
    
    if (!progress) {
      // Create new progress record if it doesn't exist
      progress = await storage.createChallengeProgress({
        userId,
        challengeId,
        currentValue: validatedData.currentValue || 0,
        completed: validatedData.completed || false,
        claimed: validatedData.claimed || false
      });
    } else {
      // Update existing progress
      progress = await storage.updateChallengeProgress(userId, challengeId, validatedData);
      
      // If marking as claimed and challenge is completed, create a reward
      if (validatedData.claimed && progress?.completed && !progress?.claimed) {
        // Create reward
        const reward = await storage.createChallengeReward({
          userId,
          challengeId,
          cashReward: challenge.cashReward,
          xpReward: challenge.xpReward,
          respectReward: challenge.respectReward,
          itemReward: challenge.itemReward
        });
        
        // Apply rewards to user
        const user = await storage.getUser(userId);
        if (user) {
          const updatedUser = await storage.updateUser(userId, {
            cash: user.cash + (challenge.cashReward || 0),
            xp: user.xp + (challenge.xpReward || 0),
            respect: user.respect + (challenge.respectReward || 0)
          });
          
          // Return both updated progress and reward
          return res.json({ progress, reward, user: updatedUser });
        }
      }
    }
    
    res.json(progress);
  } catch (error: any) {
    console.error("Error updating challenge progress:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's challenge rewards
router.get("/rewards", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const rewards = await storage.getUserChallengeRewards(userId);
    res.json(rewards);
  } catch (error: any) {
    console.error("Error getting rewards:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin routes for challenge management
router.get("/admin/challenges", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const challenges = await storage.getAllChallenges();
    res.json(challenges);
  } catch (error: any) {
    console.error("Error getting all challenges:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/admin/challenges", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = insertChallengeSchema.parse(req.body);
    const challenge = await storage.createChallenge(validatedData);
    res.status(201).json(challenge);
  } catch (error: any) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/admin/challenges/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ error: "Invalid challenge ID" });
    }
    
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    const updateSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      type: z.string().optional(),
      targetValue: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      active: z.boolean().optional(),
      cashReward: z.number().optional(),
      xpReward: z.number().optional(),
      respectReward: z.number().optional(),
      itemReward: z.number().optional()
    });
    
    const validatedData = updateSchema.parse(req.body);
    const updatedChallenge = await storage.updateChallenge(challengeId, validatedData);
    
    res.json(updatedChallenge);
  } catch (error: any) {
    console.error("Error updating challenge:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/admin/challenges/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ error: "Invalid challenge ID" });
    }
    
    const success = await storage.deleteChallenge(challengeId);
    
    if (success) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Challenge not found" });
    }
  } catch (error: any) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;