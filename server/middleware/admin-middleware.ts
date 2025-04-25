import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if the user has admin privileges
 * This should be applied to all admin routes
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied: Admin privileges required" });
  }
  
  next();
};