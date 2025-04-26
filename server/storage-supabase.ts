import { db } from './db-supabase';
import { users, gangs, gangMembers, messages } from '@shared/schema';
import { eq, and, desc, asc, sql, gt, lt, isNull, isNotNull } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db-supabase';

// Create session store with PostgreSQL
const PostgresSessionStore = connectPg(session);

/**
 * Storage interface for Supabase implementation
 */
export class SupabaseStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    });
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns User data if found, undefined otherwise
   */
  async getUser(id: number) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  /**
   * Get a user by username
   * @param username Username to search for
   * @returns User data if found, undefined otherwise
   */
  async getUserByUsername(username: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  /**
   * Get a user by Supabase ID
   * @param supabaseId Supabase ID to search for
   * @returns User data if found, undefined otherwise
   */
  async getUserBySupabaseId(supabaseId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.supabaseId, supabaseId))
        .limit(1);
      
      return user;
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Created user data
   */
  async createUser(userData: any) {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user data
   */
  async updateUser(id: number, userData: any) {
    try {
      const [user] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Get all users
   * @param limit Maximum number of users to return
   * @param offset Number of users to skip
   * @returns Array of users
   */
  async getAllUsers(limit = 50, offset = 0) {
    try {
      const result = await db
        .select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.level));
      
      return result;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Count all users
   * @returns Total number of users
   */
  async countUsers() {
    try {
      const [result] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(users);
      
      return result.count;
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  /**
   * Get a gang by ID
   * @param id Gang ID
   * @returns Gang data if found, undefined otherwise
   */
  async getGang(id: number) {
    try {
      const [gang] = await db
        .select()
        .from(gangs)
        .where(eq(gangs.id, id))
        .limit(1);
      
      return gang;
    } catch (error) {
      console.error('Error getting gang:', error);
      return undefined;
    }
  }

  /**
   * Get a gang by name
   * @param name Gang name
   * @returns Gang data if found, undefined otherwise
   */
  async getGangByName(name: string) {
    try {
      const [gang] = await db
        .select()
        .from(gangs)
        .where(eq(gangs.name, name))
        .limit(1);
      
      return gang;
    } catch (error) {
      console.error('Error getting gang by name:', error);
      return undefined;
    }
  }

  /**
   * Create a new gang
   * @param gangData Gang data to create
   * @returns Created gang data
   */
  async createGang(gangData: any) {
    try {
      const [gang] = await db
        .insert(gangs)
        .values(gangData)
        .returning();
      
      return gang;
    } catch (error) {
      console.error('Error creating gang:', error);
      throw error;
    }
  }

  /**
   * Update a gang
   * @param id Gang ID
   * @param gangData Gang data to update
   * @returns Updated gang data
   */
  async updateGang(id: number, gangData: any) {
    try {
      const [gang] = await db
        .update(gangs)
        .set(gangData)
        .where(eq(gangs.id, id))
        .returning();
      
      return gang;
    } catch (error) {
      console.error('Error updating gang:', error);
      throw error;
    }
  }

  /**
   * Get all gangs
   * @param limit Maximum number of gangs to return
   * @param offset Number of gangs to skip
   * @returns Array of gangs
   */
  async getAllGangs(limit = 50, offset = 0) {
    try {
      const result = await db
        .select()
        .from(gangs)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(gangs.respect));
      
      return result;
    } catch (error) {
      console.error('Error getting all gangs:', error);
      return [];
    }
  }

  /**
   * Add a member to a gang
   * @param memberData Member data
   * @returns Created member data
   */
  async addGangMember(memberData: any) {
    try {
      const [member] = await db
        .insert(gangMembers)
        .values(memberData)
        .returning();
      
      return member;
    } catch (error) {
      console.error('Error adding gang member:', error);
      throw error;
    }
  }

  /**
   * Get gang members
   * @param gangId Gang ID
   * @returns Array of gang members
   */
  async getGangMembers(gangId: number) {
    try {
      const result = await db
        .select()
        .from(gangMembers)
        .where(eq(gangMembers.gangId, gangId))
        .orderBy(asc(gangMembers.rank));
      
      return result;
    } catch (error) {
      console.error('Error getting gang members:', error);
      return [];
    }
  }

  /**
   * Remove a member from a gang
   * @param gangId Gang ID
   * @param userId User ID
   * @returns True if successful, false otherwise
   */
  async removeGangMember(gangId: number, userId: number) {
    try {
      await db
        .delete(gangMembers)
        .where(
          and(
            eq(gangMembers.gangId, gangId),
            eq(gangMembers.userId, userId)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error removing gang member:', error);
      return false;
    }
  }

  /**
   * Update a gang member
   * @param gangId Gang ID
   * @param userId User ID
   * @param updateData Update data
   * @returns Updated member data
   */
  async updateGangMember(gangId: number, userId: number, updateData: any) {
    try {
      const [member] = await db
        .update(gangMembers)
        .set(updateData)
        .where(
          and(
            eq(gangMembers.gangId, gangId),
            eq(gangMembers.userId, userId)
          )
        )
        .returning();
      
      return member;
    } catch (error) {
      console.error('Error updating gang member:', error);
      throw error;
    }
  }

  /**
   * Send a message
   * @param messageData Message data
   * @returns Created message data
   */
  async sendMessage(messageData: any) {
    try {
      const [message] = await db
        .insert(messages)
        .values({
          ...messageData,
          timestamp: new Date(),
          read: false,
        })
        .returning();
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a user
   * @param userId User ID
   * @param limit Maximum number of messages to return
   * @param offset Number of messages to skip
   * @returns Array of messages
   */
  async getUserMessages(userId: number, limit = 50, offset = 0) {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.receiverId, userId),
            eq(messages.senderId, userId)
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(desc(messages.timestamp));
      
      return result;
    } catch (error) {
      console.error('Error getting user messages:', error);
      return [];
    }
  }

  /**
   * Get direct messages between two users
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @param limit Maximum number of messages to return
   * @param offset Number of messages to skip
   * @returns Array of messages
   */
  async getDirectMessages(userId1: number, userId2: number, limit = 50, offset = 0) {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.type, 'direct'),
            or(
              and(
                eq(messages.senderId, userId1),
                eq(messages.receiverId, userId2)
              ),
              and(
                eq(messages.senderId, userId2),
                eq(messages.receiverId, userId1)
              )
            )
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(desc(messages.timestamp));
      
      return result;
    } catch (error) {
      console.error('Error getting direct messages:', error);
      return [];
    }
  }

  /**
   * Get gang messages
   * @param gangId Gang ID
   * @param limit Maximum number of messages to return
   * @param offset Number of messages to skip
   * @returns Array of messages
   */
  async getGangMessages(gangId: number, limit = 50, offset = 0) {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.type, 'gang'),
            eq(messages.gangId, gangId)
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(desc(messages.timestamp));
      
      return result;
    } catch (error) {
      console.error('Error getting gang messages:', error);
      return [];
    }
  }

  /**
   * Get a message by ID
   * @param id Message ID
   * @returns Message data if found, undefined otherwise
   */
  async getMessage(id: number) {
    try {
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);
      
      return message;
    } catch (error) {
      console.error('Error getting message:', error);
      return undefined;
    }
  }

  /**
   * Mark a message as read
   * @param id Message ID
   * @returns True if successful, false otherwise
   */
  async markMessageAsRead(id: number) {
    try {
      await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, id));
      
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  /**
   * Count unread messages for a user
   * @param userId User ID
   * @returns Number of unread messages
   */
  async countUnreadMessages(userId: number) {
    try {
      const [result] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.read, false)
          )
        );
      
      return result.count;
    } catch (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }
  }
}

// Export instance
export const storage = new SupabaseStorage();