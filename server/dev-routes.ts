import { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { users, userFriends, friendRequests, userStatus } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Middleware to restrict dev routes to development environment
const developmentOnly = (req: Request, res: Response, next: Function) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Access denied in production" });
  }
  next();
};

// Register development routes
export function registerDevRoutes(app: Express) {
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
}