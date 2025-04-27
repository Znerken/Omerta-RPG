import { Request, Response, NextFunction } from "express";

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
}