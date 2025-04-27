import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Extended schema for user registration
const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  email: z.string().email(),
});

// Reset token storage (in memory for now)
interface ResetToken {
  userId: number;
  token: string;
  expires: Date;
  used: boolean;
}

const resetTokens: ResetToken[] = [];

// Generate a reset token
function generateResetToken(userId: number): string {
  const token = randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
  
  // Remove any existing tokens for this user
  const userTokenIndex = resetTokens.findIndex(t => t.userId === userId);
  if (userTokenIndex >= 0) {
    resetTokens.splice(userTokenIndex, 1);
  }
  
  // Store the new token
  resetTokens.push({
    userId,
    token,
    expires,
    used: false
  });
  
  return token;
}

// Validate a reset token
function validateResetToken(token: string): ResetToken | null {
  const now = new Date();
  const tokenObj = resetTokens.find(t => t.token === token && !t.used && t.expires > now);
  return tokenObj || null;
}

// Mark a token as used
function useResetToken(token: string): boolean {
  const tokenIndex = resetTokens.findIndex(t => t.token === token);
  if (tokenIndex >= 0) {
    resetTokens[tokenIndex].used = true;
    return true;
  }
  return false;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "mafia-game-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      // Add passReqToCallback for more context if needed in the future
      passReqToCallback: false
    }, async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        // Check for valid user and password
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if user is banned
        if (user.banExpiry && new Date(user.banExpiry) > new Date()) {
          const banTimeLeft = Math.ceil((new Date(user.banExpiry).getTime() - Date.now()) / (1000 * 60 * 60));
          return done(null, false, { 
            message: `Your account is banned for ${banTimeLeft} more hours. Reason: ${user.banReason || 'No reason provided'}` 
          });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Check if user is banned (terminate session if ban is active)
      if (user.banExpiry && new Date(user.banExpiry) > new Date()) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }
      
      // Check for existing user
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // Log user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      
      // Handle bans and invalid credentials
      if (!user) {
        // If we have info with a message (like from ban check), use that
        const message = info && info.message ? info.message : "Invalid credentials";
        return res.status(401).json({ message });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  app.get("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userWithStats = await storage.getUserWithStats(req.user.id);
      if (!userWithStats) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userProfile } = userWithStats;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });

  // Password reset request endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal if the email exists or not in production
        // But for development, we'll return a clear message
        return res.status(404).json({ 
          message: "No user found with this email address." 
        });
      }
      
      // Generate a token for this user
      const token = generateResetToken(user.id);
      
      // Log the token to the console for debugging
      console.log(`PASSWORD RESET TOKEN for ${user.username}: ${token}`);
      console.log(`Reset URL: ${req.protocol}://${req.get('host')}/reset-password?token=${token}`);
      
      // Return the token to the client (for development/demo purposes)
      // In production, this would be sent via email instead
      res.status(200).json({ 
        message: "Reset token generated successfully.",
        username: user.username,
        token: token,
        resetLink: `/reset-password?token=${token}`
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  // Validate reset token endpoint
  app.get("/api/reset-password/:token/validate", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Validate the token
      const validToken = validateResetToken(token);
      
      if (!validToken) {
        return res.status(400).json({ valid: false, message: "Invalid or expired token" });
      }
      
      res.status(200).json({ valid: true });
    } catch (error) {
      console.error("Error validating reset token:", error);
      res.status(500).json({ valid: false, message: "An error occurred while validating your token" });
    }
  });
  
  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      // Validate the token
      const validToken = validateResetToken(token);
      
      if (!validToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Update the user's password
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(validToken.userId, hashedPassword);
      
      // Mark the token as used
      useResetToken(token);
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "An error occurred while resetting your password" });
    }
  });
}
