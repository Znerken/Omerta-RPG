import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAdmin } from "./middleware/admin-middleware";
import { z } from "zod";

// Validation schemas
const userSearchSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
});

const giveCashSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

const giveXpSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

const banUserSchema = z.object({
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  duration: z.number().positive("Duration must be positive"), // Duration in milliseconds
});

const jailUserSchema = z.object({
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  duration: z.number().positive("Duration must be positive"), // Duration in minutes
});

const editStatsSchema = z.object({
  strength: z.number().min(1).max(100),
  stealth: z.number().min(1).max(100),
  charisma: z.number().min(1).max(100),
  intelligence: z.number().min(1).max(100),
});

/**
 * Register admin routes
 * All these routes require admin privileges
 */
export function registerAdminRoutes(app: Express) {
  // Get all users with pagination and search
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = userSearchSchema.parse(req.query);
      
      const users = await storage.getAllUsers(page, limit, search);
      const totalUsers = await storage.getUserCount(search);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalUsers / limit);
      
      res.json({
        users: users.map(user => {
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }),
        pagination: {
          page,
          limit,
          totalItems: totalUsers,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(400).json({ message: "Failed to get users", error: error.message });
    }
  });
  
  // Get a specific user with their stats
  app.get("/api/admin/users/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserWithStats(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(400).json({ message: "Failed to get user", error: error.message });
    }
  });
  
  // Update user
  app.patch("/api/admin/users/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser!;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user", error: error.message });
    }
  });
  
  // Ban a user
  app.post("/api/admin/users/:id/ban", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason, duration } = banUserSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isAdmin) {
        return res.status(403).json({ message: "Cannot ban an admin user" });
      }
      
      // Calculate ban end time
      const banExpiry = new Date(Date.now() + duration);
      
      await storage.updateUser(userId, {
        banExpiry: banExpiry,
        banReason: reason
      });
      
      res.json({
        message: `User ${user.username} has been banned until ${banExpiry.toLocaleString()}`,
        banExpiry,
      });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(400).json({ message: "Failed to ban user", error: error.message });
    }
  });
  
  // Unban a user
  app.post("/api/admin/users/:id/unban", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.banExpiry) {
        return res.status(400).json({ message: "User is not banned" });
      }
      
      await storage.updateUser(userId, {
        banExpiry: null,
        banReason: null
      });
      
      res.json({
        message: `User ${user.username} has been unbanned`,
      });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(400).json({ message: "Failed to unban user", error: error.message });
    }
  });

  // Jail a user
  app.post("/api/admin/users/:id/jail", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason, duration } = jailUserSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isAdmin) {
        return res.status(403).json({ message: "Cannot jail an admin user" });
      }
      
      // Calculate jail end time (duration is in minutes)
      const jailTimeEnd = new Date();
      jailTimeEnd.setMinutes(jailTimeEnd.getMinutes() + duration);
      
      await storage.updateUser(userId, {
        isJailed: true,
        jailTimeEnd: jailTimeEnd,
        jailReason: reason
      });
      
      res.json({
        message: `User ${user.username} has been jailed until ${jailTimeEnd.toLocaleString()}`,
        jailTimeEnd,
      });
    } catch (error) {
      console.error("Error jailing user:", error);
      res.status(400).json({ message: "Failed to jail user", error: error.message });
    }
  });
  
  // Release a user from jail
  app.post("/api/admin/users/:id/release", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.isJailed) {
        return res.status(400).json({ message: "User is not jailed" });
      }
      
      await storage.updateUser(userId, {
        isJailed: false,
        jailTimeEnd: null,
        jailReason: null
      });
      
      res.json({
        message: `User ${user.username} has been released from jail`,
      });
    } catch (error) {
      console.error("Error releasing user from jail:", error);
      res.status(400).json({ message: "Failed to release user from jail", error: error.message });
    }
  });
  
  // Update user stats
  app.patch("/api/admin/users/:id/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const statsData = editStatsSchema.parse(req.body);
      
      const userStats = await storage.getStatsByUserId(userId);
      
      if (!userStats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      
      const updatedStats = await storage.updateStats(userId, statsData);
      
      res.json(updatedStats);
    } catch (error) {
      console.error("Error updating user stats:", error);
      res.status(400).json({ message: "Failed to update user stats", error: error.message });
    }
  });
  
  // Reset user stats to a specific value
  app.post("/api/admin/users/:id/reset-stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { value = 10, force = false } = req.body;
      
      // Validate value is between 1 and 100
      if (value < 1 || value > 100) {
        return res.status(400).json({ message: "Value must be between 1 and 100" });
      }
      
      // For user ID 1 (extortionist), we normally want to maintain special 100 values
      // unless force is true
      let updateValue = value;
      if (userId === 1 && !force) {
        updateValue = 100;
        console.log(`[ADMIN] Enforcing 100 stats for extortionist user (userId: ${userId})`);
      }
      
      const updatedStats = await storage.updateStats(userId, {
        strength: updateValue,
        stealth: updateValue,
        charisma: updateValue,
        intelligence: updateValue
      });
      
      if (!updatedStats) {
        return res.status(404).json({ message: "Stats not found for user" });
      }
      
      console.log(`[ADMIN] Stats reset to ${updateValue} for user ${userId}`);
      
      res.json({ 
        message: `Stats reset to ${updateValue} for user ${userId}`, 
        stats: updatedStats 
      });
    } catch (error) {
      console.error("Error resetting user stats:", error);
      res.status(400).json({ message: "Failed to reset user stats", error: error.message });
    }
  });
  
  // Give cash to user
  app.post("/api/admin/users/:id/give-cash", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = giveCashSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        cash: user.cash + amount,
      });
      
      res.json({
        message: `Added ${amount} cash to ${user.username}`,
        newBalance: updatedUser!.cash,
      });
    } catch (error) {
      console.error("Error giving cash:", error);
      res.status(400).json({ message: "Failed to give cash", error: error.message });
    }
  });
  
  // Give XP to user
  app.post("/api/admin/users/:id/give-xp", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = giveXpSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add XP
      const newXp = user.xp + amount;
      let updatedUser = await storage.updateUser(userId, {
        xp: newXp,
      });
      
      // Check for level up
      const newLevel = Math.floor(1 + Math.sqrt(newXp / 100));
      if (newLevel > user.level) {
        updatedUser = await storage.updateUser(userId, {
          level: newLevel,
        });
      }
      
      res.json({
        message: `Added ${amount} XP to ${user.username}${newLevel > user.level ? ` (Leveled up to ${newLevel}!)` : ''}`,
        newXp: updatedUser!.xp,
        newLevel: updatedUser!.level,
        leveledUp: newLevel > user.level,
      });
    } catch (error) {
      console.error("Error giving XP:", error);
      res.status(400).json({ message: "Failed to give XP", error: error.message });
    }
  });
  
  // Get admin dashboard data
  app.get("/api/admin/dashboard", isAdmin, async (req: Request, res: Response) => {
    try {
      // Get counts
      const totalUsers = await storage.getUserCount();
      const activeUsers = await storage.getActiveUserCount(24); // Active in last 24 hours
      const jailedUsers = await storage.getJailedUsers();
      
      // Get top users by cash
      const topUsers = await storage.getTopUsersByCash(10);
      
      // Return formatted dashboard data
      res.json({
        totalUsers,
        activeUsers,
        jailedUsers: jailedUsers.length,
        jailedUsersList: jailedUsers.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }),
        topUsers: topUsers.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }),
      });
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      res.status(400).json({ message: "Failed to get dashboard data", error: error.message });
    }
  });
}