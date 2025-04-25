import { Request, Response, NextFunction } from "express";

// Middleware to check if the user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: "Unauthorized. You must be logged in." });
}

// Middleware to check if the user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden. Admin access required." });
  }
  
  return next();
}