import { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  users, userFriends, friendRequests, userStatus, stats, userDrugs, drugs,
  drugAddictions, drugLabs, drugProduction, drugDeals, userDrugEffects,
  challengeProgress, achievementProgress
} from "@shared/schema";
import { casinoGames, casinoBets, casinoStats } from "@shared/schema-casino";
import { eq, and, like, or } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { drugStorage } from "./storage-drugs";
import { isAuthenticated, isAdmin } from "./middleware/auth";

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
  // Delete specific test users by ID (only accessible by admin)
  app.delete("/api/admin/delete-test-user/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user to verify it's a test user
      const [testUser] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!testUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!testUser.username.startsWith('tester_')) {
        return res.status(400).json({ message: "This endpoint can only delete test users (username starting with 'tester_')" });
      }
      
      console.log(`Attempting to delete test user: ${testUser.username} (ID: ${testUser.id})`);
      
      // Delete related data for this user in a specific order to avoid foreign key constraints
      
      // Handle gang-related data first
      try {
        // Check if user is a gang leader
        const leaderOfGangs = await db.execute(sql`
          SELECT id, name FROM gangs 
          WHERE owner_id = ${userId}
        `);
        
        if (leaderOfGangs.rowCount > 0) {
          console.log(`User ${userId} is a leader of gang(s):`, leaderOfGangs.rows);
          
          // For each gang the user leads
          for (const gang of leaderOfGangs.rows) {
            const gangId = gang.id;
            console.log(`Handling gang ${gangId} (${gang.name})`);
            
            // Delete all memberships for this gang
            await db.execute(sql`
              DELETE FROM gang_members 
              WHERE gang_id = ${gangId}
            `);
            
            // Delete the gang itself
            await db.execute(sql`
              DELETE FROM gangs 
              WHERE id = ${gangId}
            `);
            
            console.log(`Successfully deleted gang ${gangId} (${gang.name})`);
          }
        }
        
        // Delete user's gang memberships
        await db.execute(sql`
          DELETE FROM gang_members 
          WHERE user_id = ${userId}
        `);
        console.log(`Successfully deleted gang memberships for user ${userId}`);
      } catch (err) {
        console.warn(`Error deleting gang-related data for user ${userId}:`, err);
      }
      
      // Delete drug-related data
      try {
        // Delete user drug effects
        await db.delete(userDrugEffects).where(eq(userDrugEffects.userId, userId));
        
        // Delete drug addictions
        await db.delete(drugAddictions).where(eq(drugAddictions.userId, userId));
        
        // Delete drug deals
        await db.delete(drugDeals).where(eq(drugDeals.sellerId, userId));
        
        // Delete drug production and labs
        const labs = await db.select()
          .from(drugLabs)
          .where(eq(drugLabs.userId, userId));
        
        for (const lab of labs) {
          await db.delete(drugProduction).where(eq(drugProduction.labId, lab.id));
        }
        
        await db.delete(drugLabs).where(eq(drugLabs.userId, userId));
        
        // Delete user drugs
        await db.delete(userDrugs).where(eq(userDrugs.userId, userId));
      } catch (err) {
        console.warn(`Error deleting drug-related data for user ${userId}:`, err);
      }
      
      // Delete stats
      try {
        await db.delete(stats).where(eq(stats.userId, userId));
      } catch (err) {
        console.warn(`Error deleting stats for user ${userId}:`, err);
      }
      
      // Delete friends
      try {
        await db.delete(userFriends)
          .where(
            or(
              eq(userFriends.userId, userId),
              eq(userFriends.friendId, userId)
            )
          );
      } catch (err) {
        console.warn(`Error deleting friends for user ${userId}:`, err);
      }
      
      // Delete friend requests
      try {
        await db.delete(friendRequests)
          .where(
            or(
              eq(friendRequests.senderId, userId),
              eq(friendRequests.receiverId, userId)
            )
          );
      } catch (err) {
        console.warn(`Error deleting friend requests for user ${userId}:`, err);
      }
      
      // Delete user status
      try {
        await db.delete(userStatus).where(eq(userStatus.userId, userId));
      } catch (err) {
        console.warn(`Error deleting user status for user ${userId}:`, err);
      }
      
      // Finally, delete the user
      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, userId))
        .returning();
      
      if (!deletedUser) {
        return res.status(404).json({ 
          message: "User not found or could not be deleted",
          id: userId
        });
      }
      
      return res.json({ 
        message: `Successfully deleted test user: ${deletedUser.username}`,
        deletedUser: {
          id: deletedUser.id,
          username: deletedUser.username
        }
      });
    } catch (error) {
      console.error(`Error deleting test user with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Error deleting test user", 
        error: error.message 
      });
    }
  });
  
  // Delete all test users (only accessible by admin)
  app.delete("/api/admin/delete-test-users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Find all users with username starting with 'tester_'
      const testUsers = await db.select()
        .from(users)
        .where(like(users.username, 'tester_%'));
      
      if (testUsers.length === 0) {
        return res.json({ message: "No test users found" });
      }
      
      // Get all test user IDs
      const userIds = testUsers.map(user => user.id);
      
      // Log the test users and their IDs for debugging
      console.log("Found the following test users:");
      testUsers.forEach(user => console.log(`- ${user.username} (ID: ${user.id})`));
      
      // Delete related data for these users in a specific order to avoid foreign key constraints
      
      // First, delete all related drug data
      try {
        // Delete user drug effects
        await db.delete(userDrugEffects).where(sql`${userDrugEffects.userId} IN ${userIds}`);
        
        // Delete drug addictions
        await db.delete(drugAddictions).where(sql`${drugAddictions.userId} IN ${userIds}`);
        
        // Delete drug deals
        await db.delete(drugDeals).where(sql`${drugDeals.sellerId} IN ${userIds}`);
        
        // Delete drug production
        const labs = await db.select()
          .from(drugLabs)
          .where(sql`${drugLabs.userId} IN ${userIds}`);
        
        const labIds = labs.map(lab => lab.id);
        
        if (labIds.length > 0) {
          await db.delete(drugProduction).where(sql`${drugProduction.labId} IN ${labIds}`);
        }
        
        // Delete drug labs
        await db.delete(drugLabs).where(sql`${drugLabs.userId} IN ${userIds}`);
        
        // Delete user drugs
        await db.delete(userDrugs).where(sql`${userDrugs.userId} IN ${userIds}`);
      } catch (err) {
        console.warn("Error deleting drug-related data:", err);
        // Continue with other deletions even if some drug data fails
      }
      
      // Delete stats
      await db.delete(stats).where(sql`${stats.userId} IN ${userIds}`);
      
      // Delete user friends
      await db.delete(userFriends)
        .where(sql`${userFriends.userId} IN ${userIds} OR ${userFriends.friendId} IN ${userIds}`);
      
      // Delete friend requests
      await db.delete(friendRequests)
        .where(sql`${friendRequests.senderId} IN ${userIds} OR ${friendRequests.receiverId} IN ${userIds}`);
      
      // Delete user status
      await db.delete(userStatus).where(sql`${userStatus.userId} IN ${userIds}`);
      
      // Handle gang-related data
      try {
        // First, check if any test users are gang leaders
        const leaderOfGangs = await db.execute(sql`
          SELECT g.id, g.name, g.owner_id
          FROM gangs g
          WHERE g.owner_id IN (${sql.join(userIds, sql`, `)})
        `);
        
        if (leaderOfGangs.rowCount > 0) {
          console.log(`Found ${leaderOfGangs.rowCount} gangs led by test users`);
          
          // For each gang that has a test user as the leader
          for (const gang of leaderOfGangs.rows) {
            const gangId = gang.id;
            console.log(`Handling gang ${gangId} (${gang.name}) led by user ${gang.owner_id}`);
            
            // Delete all memberships for this gang
            await db.execute(sql`
              DELETE FROM gang_members 
              WHERE gang_id = ${gangId}
            `);
            
            // Delete the gang itself
            await db.execute(sql`
              DELETE FROM gangs 
              WHERE id = ${gangId}
            `);
            
            console.log(`Successfully deleted gang ${gangId} (${gang.name})`);
          }
        }
        
        // Delete gang memberships for all test users
        await db.execute(sql`
          DELETE FROM gang_members 
          WHERE user_id IN (${sql.join(userIds, sql`, `)})
        `);
        console.log("Successfully deleted gang memberships");
      } catch (err) {
        console.warn("Error deleting gang memberships:", err);
      }
        
      // Delete challenge progress
      try {
        await db.delete(challengeProgress).where(sql`${challengeProgress.userId} IN ${userIds}`);
      } catch (err) {
        console.warn("Error deleting challenge progress:", err);
      }
      
      // Delete achievement progress
      try {
        await db.delete(achievementProgress).where(sql`${achievementProgress.userId} IN ${userIds}`);
      } catch (err) {
        console.warn("Error deleting achievement progress:", err);
      }
      
      // Finally, delete the users
      const deletedUsers = await db.delete(users)
        .where(like(users.username, 'tester_%'))
        .returning();
      
      return res.json({ 
        message: `Successfully deleted ${deletedUsers.length} test users`, 
        deletedCount: deletedUsers.length,
        deletedUsers: deletedUsers.map(u => ({ id: u.id, username: u.username }))
      });
    } catch (error) {
      console.error("Error deleting test users:", error);
      res.status(500).json({ 
        message: "Error deleting test users", 
        error: error.message 
      });
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
  app.post("/api/dev/create-test-user", isAuthenticated, isAdmin, async (req, res) => {
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
  
  // Create casino games for testing
  app.post("/api/dev/seed-casino-games", developmentOnly, async (req, res) => {
    try {
      // Check if casino games table exists
      const casinoTableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'casino_games'
        ) as exists
      `);
      
      if (!casinoTableExists.rows[0].exists) {
        return res.status(404).json({ message: "Casino games table doesn't exist. Run db:push first." });
      }
      
      // Sample casino games
      const sampleGames = [
        {
          name: "Lucky Dice",
          type: "dice",
          description: "Predict if the dice will roll higher, lower, or exactly your target number.",
          minBet: 10,
          maxBet: 10000,
          houseEdge: 0.05,
          isActive: true,
          imageUrl: "https://i.imgur.com/jYCFwkP.png"
        },
        {
          name: "Mafia Slots",
          type: "slots",
          description: "Match symbols to win big in this classic slot machine game.",
          minBet: 25,
          maxBet: 5000,
          houseEdge: 0.08,
          isActive: true,
          imageUrl: "https://i.imgur.com/S1JbRQ1.png"
        },
        {
          name: "Family Roulette",
          type: "roulette",
          description: "Place your bets on where the ball will land.",
          minBet: 50,
          maxBet: 20000,
          houseEdge: 0.053,
          isActive: true,
          imageUrl: "https://i.imgur.com/PZTJnhY.png"
        },
        {
          name: "Consigliere Blackjack",
          type: "blackjack",
          description: "Beat the dealer's hand without going over 21.",
          minBet: 100,
          maxBet: 50000,
          houseEdge: 0.02,
          isActive: true,
          imageUrl: "https://i.imgur.com/Q2pXfDY.png"
        }
      ];
      
      // Insert games
      const insertedGames = [];
      for (const game of sampleGames) {
        try {
          const [insertedGame] = await db.insert(casinoGames)
            .values(game)
            .returning();
          
          insertedGames.push(insertedGame);
          console.log(`Created casino game: ${game.name} (ID: ${insertedGame.id})`);
        } catch (error) {
          console.error(`Error creating casino game ${game.name}:`, error);
        }
      }
      
      res.json({
        message: `Created ${insertedGames.length} casino games`,
        games: insertedGames
      });
    } catch (error) {
      console.error("Error seeding casino games:", error);
      res.status(500).json({ message: "Error seeding casino games" });
    }
  });

  // Check if casino tables exist
  app.get("/api/dev/check-casino-tables", developmentOnly, async (req, res) => {
    try {
      // Check if tables exist
      const tableResults = await db.execute(sql`
        SELECT 
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'casino_games') as games_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'casino_bets') as bets_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'casino_stats') as stats_exists
      `);
      
      const result = tableResults.rows[0];
      
      const tableStatus = [
        { table: "casino_games", exists: result.games_exists },
        { table: "casino_bets", exists: result.bets_exists },
        { table: "casino_stats", exists: result.stats_exists }
      ];

      res.json(tableStatus);
    } catch (error) {
      console.error("Error checking casino tables:", error);
      res.status(500).json({ message: "Error checking casino tables" });
    }
  });
  
  // Create casino tables manually if migration is failing
  app.post("/api/dev/create-casino-tables", developmentOnly, async (req, res) => {
    try {
      // Create game_type enum
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'casino_game_type') THEN
            CREATE TYPE casino_game_type AS ENUM ('dice', 'slots', 'roulette', 'blackjack');
          END IF;
        END
        $$;
      `);
      
      // Create bet_status enum
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'casino_bet_status') THEN
            CREATE TYPE casino_bet_status AS ENUM ('pending', 'won', 'lost', 'canceled', 'refunded');
          END IF;
        END
        $$;
      `);
      
      // Create casino_games table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS casino_games (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          game_type TEXT NOT NULL,
          description TEXT,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          min_bet INTEGER NOT NULL DEFAULT 10,
          max_bet INTEGER NOT NULL DEFAULT 10000,
          house_edge REAL NOT NULL DEFAULT 0.05,
          image_url TEXT
        )
      `);
      
      // Create casino_bets table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS casino_bets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          game_id INTEGER NOT NULL REFERENCES casino_games(id),
          bet_amount INTEGER NOT NULL,
          bet_details JSONB NOT NULL,
          result JSONB,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          settled_at TIMESTAMP
        )
      `);
      
      // Create casino_stats table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS casino_stats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          game_id INTEGER NOT NULL REFERENCES casino_games(id),
          total_bets INTEGER NOT NULL DEFAULT 0,
          total_wagered INTEGER NOT NULL DEFAULT 0,
          total_won INTEGER NOT NULL DEFAULT 0,
          total_lost INTEGER NOT NULL DEFAULT 0,
          biggest_win INTEGER NOT NULL DEFAULT 0,
          biggest_loss INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UNIQUE(user_id, game_id)
        )
      `);
      
      res.json({ message: "Casino tables created successfully" });
    } catch (error) {
      console.error("Error creating casino tables:", error);
      res.status(500).json({ 
        message: "Error creating casino tables", 
        error: error.message 
      });
    }
  });
}