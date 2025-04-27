import { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { users, userFriends, friendRequests, userStatus, stats, userDrugs, drugs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { drugStorage } from "./storage-drugs";

// Middleware to restrict dev routes to development environment
const developmentOnly = (req: Request, res: Response, next: Function) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Access denied in production" });
  }
  next();
};

// Hash password helper function
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Utility to generate random strings
function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Register development routes
export function registerDevRoutes(app: Express) {
  // Reset a user's password (development only)
  app.post("/api/dev/reset-password", developmentOnly, async (req, res) => {
    try {
      const { username, newPassword } = req.body;
      
      if (!username || !newPassword) {
        return res.status(400).json({ message: "Username and new password are required" });
      }
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: `User '${username}' not found` });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      const updatedUser = await db.update(users)
        .set({
          password: hashedPassword
        })
        .where(eq(users.id, user.id))
        .returning();
      
      if (!updatedUser || updatedUser.length === 0) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.json({ message: `Password for user '${username}' has been reset successfully` });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  // Check if necessary tables exist
  app.get("/api/dev/check-social-tables", developmentOnly, async (req, res) => {
    try {
      // Check if tables exist
      const tableResults = await db.execute(sql`
        SELECT 
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_friends') as user_friends_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'friend_requests') as friend_requests_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_status') as user_status_exists
      `);
      
      const result = tableResults.rows[0];
      
      const tableStatus = [
        { table: "user_friends", exists: result.user_friends_exists },
        { table: "friend_requests", exists: result.friend_requests_exists },
        { table: "user_status", exists: result.user_status_exists }
      ];

      res.json(tableStatus);
    } catch (error) {
      console.error("Error checking tables:", error);
      res.status(500).json({ message: "Error checking tables" });
    }
  });
  
  // Create necessary tables if they don't exist
  app.post("/api/dev/create-social-tables", developmentOnly, async (req, res) => {
    try {
      // Create user_friends table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_friends (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          friend_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, friend_id)
        )
      `);
      
      // Create friend_requests table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS friend_requests (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(sender_id, receiver_id)
        )
      `);
      
      // Create user_status table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_status (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          status TEXT DEFAULT 'offline',
          last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_location TEXT
        )
      `);
      
      res.json({ message: "Tables created successfully" });
    } catch (error) {
      console.error("Error creating tables:", error);
      res.status(500).json({ message: "Error creating tables" });
    }
  });
  
  // Get test users for friend system testing
  app.get("/api/dev/test-users", developmentOnly, async (req, res) => {
    try {
      // Get all users
      const testUsers = await db.select({
        id: users.id,
        username: users.username,
        avatar: users.avatar
      })
      .from(users)
      .limit(10);
      
      res.json(testUsers);
    } catch (error) {
      console.error("Error getting test users:", error);
      res.status(500).json({ message: "Error getting test users" });
    }
  });
  
  // Create test relationships
  app.post("/api/dev/create-test-relationships", developmentOnly, async (req, res) => {
    try {
      // Use provided userId from request body or use current user if authenticated
      const userId = req.body.userId || (req.isAuthenticated() ? req.user.id : 1);
      const currentUserId = userId;
      
      // Get some test users (excluding current user)
      const testUsers = await db.select({
        id: users.id
      })
      .from(users)
      .where(eq(users.id, currentUserId).not())
      .limit(5);
      
      const userIds = testUsers.map(user => user.id);
      
      if (userIds.length === 0) {
        return res.status(404).json({ message: "No test users found" });
      }
      
      let created = 0;
      let skipped = 0;
      
      // Create friend relationships and requests with different statuses
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        
        try {
          // Different types of relationships based on index
          if (i === 0) {
            // First user: direct friendship
            await db.insert(userFriends).values({
              userId: currentUserId,
              friendId: userId,
              createdAt: new Date()
            }).onConflictDoNothing();
            created++;
          } else if (i === 1) {
            // Second user: pending request from current user
            await db.insert(friendRequests).values({
              senderId: currentUserId,
              receiverId: userId,
              status: "pending",
              createdAt: new Date()
            }).onConflictDoNothing();
            created++;
          } else if (i === 2) {
            // Third user: pending request to current user
            await db.insert(friendRequests).values({
              senderId: userId,
              receiverId: currentUserId,
              status: "pending",
              createdAt: new Date()
            }).onConflictDoNothing();
            created++;
          } else if (i === 3) {
            // Fourth user: rejected request
            await db.insert(friendRequests).values({
              senderId: currentUserId,
              receiverId: userId,
              status: "rejected",
              createdAt: new Date()
            }).onConflictDoNothing();
            created++;
          }
          // Fifth user: no relationship (for testing "Add Friend")
        } catch (error) {
          console.error(`Error creating relationship with user ${userId}:`, error);
          skipped++;
        }
      }
      
      // Create some random status entries
      for (const userId of userIds) {
        try {
          // Random statuses
          const statuses = ["online", "offline", "away", "busy"];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Insert or update status
          await db.insert(userStatus).values({
            userId,
            status: randomStatus,
            lastActive: new Date()
          })
          .onConflictDoUpdate({
            target: userStatus.userId,
            set: {
              status: randomStatus,
              lastActive: new Date()
            }
          });
        } catch (error) {
          console.error(`Error creating status for user ${userId}:`, error);
        }
      }
      
      res.json({
        message: `Created ${created} relationships (${skipped} skipped) with ${userIds.length} test users`
      });
    } catch (error) {
      console.error("Error creating test relationships:", error);
      res.status(500).json({ message: "Error creating test relationships" });
    }
  });
  
  // Create a random test user with predefined parameters
  app.post("/api/dev/create-test-user", async (req, res) => {
    try {
      // Generate random username and email
      const randomStr = generateRandomString(8);
      const username = `tester_${randomStr}`;
      const email = `test_${randomStr}@example.com`;
      const password = "password123"; // Simple password for test users
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username) || await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists, try again" });
      }
      
      // Create the user with hashed password - only pass valid fields to createUser
      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
      });
      
      // Update the user with additional fields after creation
      await db.update(users)
        .set({
          level: 5,
          xp: 0,
          cash: 500000, // 500,000 cash
          respect: 100
        })
        .where(eq(users.id, user.id));
      
      console.log(`Created test user: ${username} (ID: ${user.id})`);
      
      // Create stats with 20 of every stat
      await db.insert(stats).values({
        userId: user.id,
        strength: 20,
        stealth: 20,
        charisma: 20,
        intelligence: 20,
      });
      
      console.log(`Created stats for user ${username}`);
      
      // Add drugs to inventory (get first 5 drugs from database)
      const availableDrugs = await db.select().from(drugs).limit(5);
      
      // Add each drug to user inventory (20 of each)
      for (const drug of availableDrugs) {
        await db.insert(userDrugs).values({
          userId: user.id,
          drugId: drug.id,
          quantity: 20,
          acquiredAt: new Date()
        });
        console.log(`Added ${drug.name} (x20) to user ${username}'s inventory`);
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in test user:", err);
          return res.status(500).json({ message: "User created but failed to log in automatically" });
        }
        
        // Return success with user info
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ 
          message: "Test user created and logged in successfully", 
          user: userWithoutPassword,
          credentials: {
            username,
            password: "password123"
          }
        });
      });
    } catch (error) {
      console.error("Error creating test user:", error);
      res.status(500).json({ message: "Failed to create test user" });
    }
  });
}