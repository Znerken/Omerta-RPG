import { Request, Response, NextFunction } from "express";

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if the user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: You must be logged in" });
  }

  // Check if the authenticated user has admin privileges
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
  }

  // If the user is authenticated and has admin privileges, proceed
  next();
}