import { Express, Request, Response } from "express";
import { isAdmin } from "./middleware/admin-middleware";
import { storage } from "./storage";

export function registerAdminRoutes(app: Express) {
  // Apply the admin middleware to all admin routes
  const adminRouter = app.route("/api/admin/*").all(isAdmin);

  // Get all users (with pagination)
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || "";
      
      const users = await storage.getAllUsers(page, limit, search);
      const total = await storage.getUserCount(search);
      
      return res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Get user by ID
  app.get("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserWithStats(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Update user (admin can update any user property)
  app.patch("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(updatedUser);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Ban/unban user
  app.post("/api/admin/users/:id/ban", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason, duration } = req.body;
      const durationMs = duration || 24 * 60 * 60 * 1000; // Default 24 hours
      
      const jailTimeEnd = new Date(Date.now() + durationMs);
      
      const updatedUser = await storage.updateUser(userId, {
        isJailed: true,
        jailTimeEnd,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        success: true,
        message: `User banned until ${jailTimeEnd.toISOString()}`,
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/unban", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      const updatedUser = await storage.updateUser(userId, {
        isJailed: false,
        jailTimeEnd: null,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        success: true,
        message: "User unbanned",
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Update user stats
  app.patch("/api/admin/users/:id/stats", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const statsData = req.body;
      
      const updatedStats = await storage.updateStats(userId, statsData);
      
      if (!updatedStats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      
      return res.json(updatedStats);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Give cash to user
  app.post("/api/admin/users/:id/give-cash", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valid amount required" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        cash: user.cash + amount
      });
      
      return res.json({
        success: true,
        message: `$${amount.toLocaleString()} added to user's account`,
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Give XP to user
  app.post("/api/admin/users/:id/give-xp", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valid amount required" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        xp: user.xp + amount
      });
      
      return res.json({
        success: true,
        message: `${amount.toLocaleString()} XP added to user's account`,
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/dashboard", async (req: Request, res: Response) => {
    try {
      const totalUsers = await storage.getUserCount();
      const activeUsers = await storage.getActiveUserCount(24); // active in last 24h
      const jailedUsers = await storage.getJailedUsers();
      const topUsers = await storage.getTopUsersByCash(5);
      
      return res.json({
        totalUsers,
        activeUsers,
        jailedUsers: jailedUsers.length,
        topUsers
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
}