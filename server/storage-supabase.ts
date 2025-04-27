import { db } from './db-supabase';
import { users, userStats, userFriends, gangs, gangMembers, messages } from '@shared/schema';
import { eq, and, asc, desc, sql, not, inArray, isNull, or, like } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db-supabase';

// Create schema for user insertion
const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8),
});

// Create TypeScript type from schema
export type InsertUser = z.infer<typeof insertUserSchema>;

// Create schema for message insertion
const insertMessageSchema = createInsertSchema(messages);
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

/**
 * Storage implementation for Supabase-based integration
 */
export class SupabaseStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session', // Default table name for connect-pg-simple
      createTableIfMissing: true
    });
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns User object or undefined if not found
   */
  async getUser(id: number) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.id, id),
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  /**
   * Get user by username
   * @param username Username
   * @returns User object or undefined if not found
   */
  async getUserByUsername(username: string) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.username, username),
      });
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  /**
   * Get user by email
   * @param email Email
   * @returns User object or undefined if not found
   */
  async getUserByEmail(email: string) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.email, email),
      });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  /**
   * Get user by Supabase ID
   * @param supabaseId Supabase user ID
   * @returns User object or undefined if not found
   */
  async getUserBySupabaseId(supabaseId: string) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.supabaseId, supabaseId),
      });
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  /**
   * Create a new user
   * @param user User data to insert
   * @returns Created user object
   */
  async createUser(user: InsertUser) {
    try {
      const [insertedUser] = await db
        .insert(users)
        .values({
          ...user,
          createdAt: new Date(),
          lastSeen: new Date(),
          status: 'offline'
        })
        .returning();

      return insertedUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Create user stats for a new user
   * @param userId User ID
   * @returns Created user stats
   */
  async createUserStats(userId: number) {
    try {
      const [insertedStats] = await db
        .insert(userStats)
        .values({
          userId,
          strength: 10,
          stealth: 10,
          charisma: 10,
          intelligence: 10,
        })
        .returning();

      return insertedStats;
    } catch (error) {
      console.error('Error creating user stats:', error);
      throw error;
    }
  }

  /**
   * Update user data
   * @param id User ID
   * @param updates Fields to update
   * @returns Updated user
   */
  async updateUser(id: number, updates: Partial<typeof users.$inferInsert>) {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Set user's Supabase ID
   * @param id User ID
   * @param supabaseId Supabase user ID
   * @returns Updated user
   */
  async setSupabaseId(id: number, supabaseId: string) {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ supabaseId })
        .where(eq(users.id, id))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error setting Supabase ID:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param id User ID
   * @returns Success boolean
   */
  async deleteUser(id: number) {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Get all users with pagination
   * @param page Page number (starting from 1)
   * @param limit Items per page
   * @returns Users array
   */
  async getUsers(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      return await db.query.users.findMany({
        limit,
        offset,
        orderBy: [asc(users.id)],
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * Get user's gang
   * @param userId User ID
   * @returns Gang object or undefined
   */
  async getUserGang(userId: number) {
    try {
      // Get gang member entry
      const gangMember = await db.query.gangMembers.findFirst({
        where: eq(gangMembers.userId, userId),
      });

      if (!gangMember) {
        return undefined;
      }

      // Get gang details
      return await db.query.gangs.findFirst({
        where: eq(gangs.id, gangMember.gangId),
      });
    } catch (error) {
      console.error('Error getting user gang:', error);
      return undefined;
    }
  }

  /**
   * Get user with stats
   * @param userId User ID
   * @returns User stats or undefined
   */
  async getUserStats(userId: number) {
    try {
      return await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      return undefined;
    }
  }

  /**
   * Get user with full profile (user data + stats + gang)
   * @param userId User ID
   * @returns Full user profile or undefined
   */
  async getUserWithProfile(userId: number) {
    try {
      // Get base user data
      const user = await this.getUser(userId);
      if (!user) {
        return undefined;
      }

      // Get user stats
      const stats = await this.getUserStats(userId);

      // Get user's gang
      const gang = await this.getUserGang(userId);

      // Get gang rank if in a gang
      let gangRank = null;
      if (gang) {
        const gangMember = await db.query.gangMembers.findFirst({
          where: and(
            eq(gangMembers.userId, userId),
            eq(gangMembers.gangId, gang.id)
          ),
        });
        if (gangMember) {
          gangRank = gangMember.rank;
        }
      }

      // Return compiled user profile
      return {
        ...user,
        stats,
        gang,
        gangRank,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return undefined;
    }
  }

  /**
   * Get user's friends
   * @param userId User ID
   * @returns Array of friends
   */
  async getUserFriends(userId: number) {
    try {
      // Get friend relationships
      const relationships = await db.query.userFriends.findMany({
        where: eq(userFriends.userId, userId),
      });

      if (relationships.length === 0) {
        return [];
      }

      // Get friend IDs
      const friendIds = relationships.map((rel) => rel.friendId);

      // Get friend data
      return await db.query.users.findMany({
        where: inArray(users.id, friendIds),
      });
    } catch (error) {
      console.error('Error getting user friends:', error);
      return [];
    }
  }

  /**
   * Add a friend
   * @param userId User ID
   * @param friendId Friend ID
   * @returns Success boolean
   */
  async addFriend(userId: number, friendId: number) {
    try {
      // Check if friendship already exists
      const existing = await db.query.userFriends.findFirst({
        where: and(
          eq(userFriends.userId, userId),
          eq(userFriends.friendId, friendId)
        ),
      });

      if (existing) {
        return false; // Friendship already exists
      }

      // Add friendship in both directions
      await db.insert(userFriends).values({ userId, friendId });
      await db.insert(userFriends).values({ userId: friendId, friendId: userId });

      return true;
    } catch (error) {
      console.error('Error adding friend:', error);
      return false;
    }
  }

  /**
   * Remove a friend
   * @param userId User ID
   * @param friendId Friend ID
   * @returns Success boolean
   */
  async removeFriend(userId: number, friendId: number) {
    try {
      // Remove friendship in both directions
      await db
        .delete(userFriends)
        .where(
          and(
            eq(userFriends.userId, userId),
            eq(userFriends.friendId, friendId)
          )
        );

      await db
        .delete(userFriends)
        .where(
          and(
            eq(userFriends.userId, friendId),
            eq(userFriends.friendId, userId)
          )
        );

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  }

  /**
   * Send a message
   * @param message Message data
   * @returns Created message
   */
  async sendMessage(message: InsertMessage) {
    try {
      const [createdMessage] = await db
        .insert(messages)
        .values({
          ...message,
          timestamp: new Date(),
        })
        .returning();

      return createdMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages between users
   * @param userId User ID
   * @param otherUserId Other user ID
   * @param limit Max messages to return
   * @param before Timestamp to get messages before
   * @returns Array of messages
   */
  async getMessages(userId: number, otherUserId: number, limit = 50, before?: Date) {
    try {
      let query = db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.type, 'direct'),
            or(
              and(
                eq(messages.senderId, userId),
                eq(messages.receiverId, otherUserId)
              ),
              and(
                eq(messages.senderId, otherUserId),
                eq(messages.receiverId, userId)
              )
            )
          )
        );

      if (before) {
        query = query.where(
          sql`${messages.timestamp} < ${before}`
        );
      }

      return await query
        .orderBy(desc(messages.timestamp))
        .limit(limit);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Get unread message count
   * @param userId User ID
   * @returns Count of unread messages
   */
  async getUnreadMessageCount(userId: number) {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.read, false)
          )
        );

      return result[0].count;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  /**
   * Mark a message as read
   * @param messageId Message ID
   * @returns Updated message
   */
  async markMessageAsRead(messageId: number) {
    try {
      const [updatedMessage] = await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, messageId))
        .returning();

      return updatedMessage;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get gang messages
   * @param gangId Gang ID
   * @param limit Max messages to return
   * @param before Timestamp to get messages before
   * @returns Array of messages
   */
  async getGangMessages(gangId: number, limit = 50, before?: Date) {
    try {
      let query = db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.type, 'gang'),
            eq(messages.gangId, gangId)
          )
        );

      if (before) {
        query = query.where(
          sql`${messages.timestamp} < ${before}`
        );
      }

      const gangMessages = await query
        .orderBy(desc(messages.timestamp))
        .limit(limit);

      // Get sender information for each message
      const messagesWithSenders = await Promise.all(
        gangMessages.map(async (message) => {
          const sender = await this.getUser(message.senderId);
          return {
            ...message,
            sender: {
              id: sender?.id,
              username: sender?.username,
              avatar: sender?.avatar,
            },
          };
        })
      );

      return messagesWithSenders;
    } catch (error) {
      console.error('Error getting gang messages:', error);
      return [];
    }
  }

  /**
   * Update a user's status
   * @param userId User ID
   * @param status New status (online, away, busy, offline)
   * @returns Updated user
   */
  async updateUserStatus(userId: number, status: string) {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          status, 
          lastSeen: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Search users by username or email
   * @param query Search query string
   * @param limit Max results to return
   * @returns Array of matching users
   */
  async searchUsers(query: string, limit = 20) {
    try {
      const searchPattern = `%${query}%`;
      
      return await db.query.users.findMany({
        where: or(
          like(users.username, searchPattern),
          like(users.email, searchPattern)
        ),
        limit,
      });
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Get online users count
   * @returns Count of online users
   */
  async getOnlineUsersCount() {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.status, 'online'));

      return result[0].count;
    } catch (error) {
      console.error('Error getting online users count:', error);
      return 0;
    }
  }

  /**
   * Jail a user
   * @param userId User ID
   * @param durationMinutes Jail duration in minutes
   * @param reason Reason for jailing (optional)
   * @returns Updated user
   */
  async jailUser(userId: number, durationMinutes: number, reason?: string) {
    try {
      const jailTimeEnd = new Date();
      jailTimeEnd.setMinutes(jailTimeEnd.getMinutes() + durationMinutes);

      const [jailedUser] = await db
        .update(users)
        .set({
          isJailed: true,
          jailTimeEnd,
          jailReason: reason || null,
        })
        .where(eq(users.id, userId))
        .returning();

      return jailedUser;
    } catch (error) {
      console.error('Error jailing user:', error);
      throw error;
    }
  }

  /**
   * Release a user from jail
   * @param userId User ID
   * @returns Updated user
   */
  async releaseUserFromJail(userId: number) {
    try {
      const [releasedUser] = await db
        .update(users)
        .set({
          isJailed: false,
          jailTimeEnd: null,
          jailReason: null,
        })
        .where(eq(users.id, userId))
        .returning();

      return releasedUser;
    } catch (error) {
      console.error('Error releasing user from jail:', error);
      throw error;
    }
  }

  /**
   * Ban a user
   * @param userId User ID
   * @param durationDays Ban duration in days (0 for permanent)
   * @param reason Ban reason
   * @returns Updated user
   */
  async banUser(userId: number, durationDays: number, reason: string) {
    try {
      let banExpiry = null;
      
      if (durationDays > 0) {
        banExpiry = new Date();
        banExpiry.setDate(banExpiry.getDate() + durationDays);
      }

      const [bannedUser] = await db
        .update(users)
        .set({
          banExpiry,
          banReason: reason,
        })
        .where(eq(users.id, userId))
        .returning();

      return bannedUser;
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  /**
   * Unban a user
   * @param userId User ID
   * @returns Updated user
   */
  async unbanUser(userId: number) {
    try {
      const [unbannedUser] = await db
        .update(users)
        .set({
          banExpiry: null,
          banReason: null,
        })
        .where(eq(users.id, userId))
        .returning();

      return unbannedUser;
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  }

  /**
   * Check if users that should be released from jail can be released
   * @returns Number of users released
   */
  async processJailReleases() {
    try {
      const now = new Date();
      
      const users = await db.query.users.findMany({
        where: and(
          eq(users.isJailed, true),
          not(isNull(users.jailTimeEnd)),
          sql`${users.jailTimeEnd} <= ${now}`
        ),
      });

      let releasedCount = 0;
      
      for (const user of users) {
        await this.releaseUserFromJail(user.id);
        releasedCount++;
      }

      return releasedCount;
    } catch (error) {
      console.error('Error processing jail releases:', error);
      return 0;
    }
  }
}

// Create storage instance
export const storage = new SupabaseStorage();