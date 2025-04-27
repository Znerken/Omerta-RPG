import { db } from './db-supabase';
import { users, userStats, userFriends, messages, gangs, gangMembers } from '@shared/schema';
import { eq, and, or, desc, not, isNull } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { pool } from './db-supabase';

const PostgresSessionStore = connectPg(session);

/**
 * Storage interface for the application using Supabase and PostgreSQL
 */
export class SupabaseStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns User if found, undefined otherwise
   */
  async getUser(id: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    
    return user || undefined;
  }

  /**
   * Get a user by username
   * @param username Username
   * @returns User if found, undefined otherwise
   */
  async getUserByUsername(username: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    return user || undefined;
  }

  /**
   * Get a user by email
   * @param email Email
   * @returns User if found, undefined otherwise
   */
  async getUserByEmail(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    return user || undefined;
  }

  /**
   * Get a user by Supabase ID
   * @param supabaseId Supabase Auth ID
   * @returns User if found, undefined otherwise
   */
  async getUserBySupabaseId(supabaseId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseId)
    });
    
    return user || undefined;
  }

  /**
   * Create a new user
   * @param userData User data to insert
   * @returns Created user
   */
  async createUser(userData: any) {
    // Insert user into database
    const [newUser] = await db.insert(users).values(userData).returning();
    
    // Create stats for the user
    await db.insert(userStats).values({
      userId: newUser.id,
      strength: 10,
      stealth: 10,
      charisma: 10,
      intelligence: 10,
      strengthTrainingCooldown: null,
      stealthTrainingCooldown: null,
      charismaTrainingCooldown: null,
      intelligenceTrainingCooldown: null
    });
    
    return newUser;
  }

  /**
   * Update a user
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user
   */
  async updateUser(id: number, userData: any) {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  /**
   * Get user stats
   * @param userId User ID
   * @returns User stats if found, undefined otherwise
   */
  async getUserStats(userId: number) {
    const stats = await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId)
    });
    
    return stats || undefined;
  }

  /**
   * Update user stats
   * @param userId User ID
   * @param statsData Stats data to update
   * @returns Updated stats
   */
  async updateUserStats(userId: number, statsData: any) {
    const [updatedStats] = await db
      .update(userStats)
      .set(statsData)
      .where(eq(userStats.userId, userId))
      .returning();
    
    return updatedStats;
  }

  /**
   * Get a user's gang
   * @param userId User ID
   * @returns Gang info if user is in a gang, undefined otherwise
   */
  async getUserGang(userId: number) {
    // Get the gang member record
    const gangMember = await db.query.gangMembers.findFirst({
      where: eq(gangMembers.userId, userId)
    });
    
    if (!gangMember) {
      return undefined;
    }
    
    // Get the gang details
    const gang = await db.query.gangs.findFirst({
      where: eq(gangs.id, gangMember.gangId)
    });
    
    if (!gang) {
      return undefined;
    }
    
    // Count gang members
    const gangMembersCount = await db
      .select({ count: db.fn.count() })
      .from(gangMembers)
      .where(eq(gangMembers.gangId, gang.id));
    
    // Get gang boss
    const gangBoss = await db.query.gangMembers.findFirst({
      where: and(
        eq(gangMembers.gangId, gang.id),
        eq(gangMembers.rank, 'Boss')
      ),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            avatar: true,
            level: true,
            status: true,
            lastSeen: true
          }
        }
      }
    });

    // Return combined data
    return {
      ...gang,
      memberCount: Number(gangMembersCount[0]?.count || 0),
      userRank: gangMember.rank,
      boss: gangBoss?.user
    };
  }

  /**
   * Get user's friends
   * @param userId User ID
   * @returns List of friends
   */
  async getUserFriends(userId: number) {
    // Get all friend relationships where userId is either the user or the friend
    const friendRelations = await db.query.userFriends.findMany({
      where: or(
        eq(userFriends.userId, userId),
        eq(userFriends.friendId, userId)
      ),
      with: {
        user: true,
        friend: true
      }
    });
    
    // Transform the relations into a simple list of friend users
    const friends = friendRelations.map(relation => {
      // If userId is the friend in this relation, return the user
      if (relation.friendId === userId) {
        return relation.user;
      }
      // Otherwise, return the friend
      return relation.friend;
    });
    
    return friends;
  }

  /**
   * Send a message
   * @param messageData Message data
   * @returns The created message
   */
  async sendMessage(messageData: any) {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  /**
   * Mark a message as read
   * @param messageId Message ID
   * @returns The updated message
   */
  async markMessageAsRead(messageId: number) {
    const [updatedMessage] = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId))
      .returning();
    
    return updatedMessage;
  }

  /**
   * Get unread messages for a user
   * @param userId User ID
   * @returns List of unread messages
   */
  async getUnreadMessages(userId: number) {
    const unreadMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.receiverId, userId),
        eq(messages.read, false)
      ),
      orderBy: [desc(messages.timestamp)],
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
    
    return unreadMessages;
  }

  /**
   * Get conversation between two users
   * @param userId User ID
   * @param otherUserId Other user ID
   * @param limit Max number of messages to return
   * @param offset Offset for pagination
   * @returns List of messages
   */
  async getConversation(userId: number, otherUserId: number, limit = 20, offset = 0) {
    const conversation = await db.query.messages.findMany({
      where: or(
        and(
          eq(messages.senderId, userId),
          eq(messages.receiverId, otherUserId)
        ),
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId)
        )
      ),
      orderBy: [desc(messages.timestamp)],
      limit,
      offset,
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
    
    return conversation;
  }

  /**
   * Get gang messages
   * @param gangId Gang ID
   * @param limit Max number of messages to return
   * @param offset Offset for pagination
   * @returns List of gang messages
   */
  async getGangMessages(gangId: number, limit = 20, offset = 0) {
    const gangMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.type, 'gang'),
        eq(messages.gangId, gangId)
      ),
      orderBy: [desc(messages.timestamp)],
      limit,
      offset,
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
    
    return gangMessages;
  }
}

// Create and export a storage instance
export const storage = new SupabaseStorage();