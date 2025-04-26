import { db } from './db-supabase';
import { supabaseClient } from './supabase';
import { 
  users, User, InsertUser, 
  userStatus, UserStatus, InsertUserStatus,
  userFriends, UserFriend, InsertUserFriend,
  friendRequests, FriendRequest, InsertFriendRequest
} from '@shared/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { PostgresError } from '@neondatabase/serverless';
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { IStorage } from './storage';

// Set up session store
const PostgresSessionStore = connectPg(session);
const pool = {
  query: async (text: string, params: any[]) => {
    return await db.execute(sql.raw(text, params));
  }
};

/**
 * Supabase Storage Implementation
 */
export class SupabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
      return user;
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      if (error instanceof PostgresError) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Username or email already exists');
        }
      }
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // User Status Methods
  async getUserStatus(userId: number): Promise<UserStatus | undefined> {
    try {
      const [status] = await db
        .select()
        .from(userStatus)
        .where(eq(userStatus.userId, userId));
      return status;
    } catch (error) {
      console.error('Error getting user status:', error);
      return undefined;
    }
  }

  async createUserStatus(status: InsertUserStatus): Promise<UserStatus> {
    try {
      const [newStatus] = await db
        .insert(userStatus)
        .values(status)
        .returning();
      return newStatus;
    } catch (error) {
      console.error('Error creating user status:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: number, status: Partial<UserStatus>): Promise<UserStatus | undefined> {
    try {
      const [updatedStatus] = await db
        .update(userStatus)
        .set(status)
        .where(eq(userStatus.userId, userId))
        .returning();
      return updatedStatus;
    } catch (error) {
      console.error('Error updating user status:', error);
      return undefined;
    }
  }

  // Friend Methods
  async getUserFriends(userId: number): Promise<UserFriend[]> {
    try {
      // Get all friendships where the user is either user1 or user2
      const userFriendships = await db
        .select()
        .from(userFriends)
        .where(
          sql`${userFriends.userId1} = ${userId} OR ${userFriends.userId2} = ${userId}`
        );
      return userFriendships;
    } catch (error) {
      console.error('Error getting user friends:', error);
      return [];
    }
  }

  async getFriendship(userId1: number, userId2: number): Promise<UserFriend | undefined> {
    try {
      // Find friendship regardless of which user is user1 or user2
      const [friendship] = await db
        .select()
        .from(userFriends)
        .where(
          sql`(${userFriends.userId1} = ${userId1} AND ${userFriends.userId2} = ${userId2})
               OR (${userFriends.userId1} = ${userId2} AND ${userFriends.userId2} = ${userId1})`
        );
      return friendship;
    } catch (error) {
      console.error('Error getting friendship:', error);
      return undefined;
    }
  }

  async createFriendship(friendshipData: InsertUserFriend): Promise<UserFriend> {
    try {
      const [friendship] = await db
        .insert(userFriends)
        .values(friendshipData)
        .returning();
      return friendship;
    } catch (error) {
      console.error('Error creating friendship:', error);
      throw error;
    }
  }

  async removeFriendship(userId1: number, userId2: number): Promise<boolean> {
    try {
      await db
        .delete(userFriends)
        .where(
          sql`(${userFriends.userId1} = ${userId1} AND ${userFriends.userId2} = ${userId2})
               OR (${userFriends.userId1} = ${userId2} AND ${userFriends.userId2} = ${userId1})`
        );
      return true;
    } catch (error) {
      console.error('Error removing friendship:', error);
      return false;
    }
  }

  // Friend Request Methods
  async getFriendRequest(senderId: number, receiverId: number): Promise<FriendRequest | undefined> {
    try {
      const [request] = await db
        .select()
        .from(friendRequests)
        .where(
          and(
            eq(friendRequests.senderId, senderId),
            eq(friendRequests.receiverId, receiverId)
          )
        );
      return request;
    } catch (error) {
      console.error('Error getting friend request:', error);
      return undefined;
    }
  }

  async createFriendRequest(requestData: InsertFriendRequest): Promise<FriendRequest> {
    try {
      const [request] = await db
        .insert(friendRequests)
        .values(requestData)
        .returning();
      return request;
    } catch (error) {
      console.error('Error creating friend request:', error);
      throw error;
    }
  }

  async updateFriendRequest(
    requestId: number,
    data: Partial<FriendRequest>
  ): Promise<FriendRequest | undefined> {
    try {
      const [updatedRequest] = await db
        .update(friendRequests)
        .set(data)
        .where(eq(friendRequests.id, requestId))
        .returning();
      return updatedRequest;
    } catch (error) {
      console.error('Error updating friend request:', error);
      return undefined;
    }
  }

  async deleteFriendRequest(requestId: number): Promise<boolean> {
    try {
      await db
        .delete(friendRequests)
        .where(eq(friendRequests.id, requestId));
      return true;
    } catch (error) {
      console.error('Error deleting friend request:', error);
      return false;
    }
  }

  async getPendingFriendRequests(userId: number): Promise<FriendRequest[]> {
    try {
      const requests = await db
        .select()
        .from(friendRequests)
        .where(
          and(
            eq(friendRequests.receiverId, userId),
            eq(friendRequests.status, 'pending')
          )
        )
        .orderBy(desc(friendRequests.createdAt));
      return requests;
    } catch (error) {
      console.error('Error getting pending friend requests:', error);
      return [];
    }
  }

  async getSentFriendRequests(userId: number): Promise<FriendRequest[]> {
    try {
      const requests = await db
        .select()
        .from(friendRequests)
        .where(
          and(
            eq(friendRequests.senderId, userId),
            eq(friendRequests.status, 'pending')
          )
        )
        .orderBy(desc(friendRequests.createdAt));
      return requests;
    } catch (error) {
      console.error('Error getting sent friend requests:', error);
      return [];
    }
  }

  // Additional methods will be added as needed...
}

export const storage = new SupabaseStorage();