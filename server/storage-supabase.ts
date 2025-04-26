import { IStorage } from './storage';
import { db } from './db-supabase';
import { 
  users, 
  userStats, 
  gangMembers, 
  gangs, 
  messages, 
  friends,
  friendRequests,
  achievements,
  achievementProgress
} from '@shared/schema';
import { eq, and, or, desc, sql, asc, not, inArray } from 'drizzle-orm';
import { supabaseAdmin } from './supabase';

/**
 * Supabase Storage Implementation
 * Implements IStorage interface for database operations
 */
export class SupabaseStorage implements IStorage {
  /**
   * User Operations
   */
  
  // Get user by ID
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Get user by username
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // Get user by Supabase ID
  async getUserBySupabaseId(supabaseId: string) {
    const [user] = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
    return user;
  }

  // Get user by email
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Create a new user
  async createUser(userData: any) {
    const [user] = await db.insert(users).values(userData).returning();
    
    // Create default user stats
    await db.insert(userStats).values({
      userId: user.id,
      strength: 10,
      stealth: 10,
      charisma: 10,
      intelligence: 10,
      strengthTrainingCooldown: new Date(),
      stealthTrainingCooldown: new Date(),
      charismaTrainingCooldown: new Date(),
      intelligenceTrainingCooldown: new Date()
    });
    
    return user;
  }

  // Update user data
  async updateUser(id: number, userData: any) {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Get all users
  async getAllUsers() {
    return await db.select().from(users);
  }

  // Count users
  async countUsers() {
    const [result] = await db.select({
      count: sql<number>`count(*)`
    }).from(users);
    
    return result.count;
  }

  // Delete user
  async deleteUser(id: number) {
    const [user] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    
    // If user has a supabaseId, delete from Supabase Auth too
    if (user?.supabaseId) {
      await supabaseAdmin.auth.admin.deleteUser(user.supabaseId);
    }
    
    return user;
  }
  
  /**
   * User Stats Operations
   */
  
  // Get user stats
  async getUserStats(userId: number) {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  // Update user stats
  async updateUserStats(userId: number, statsData: any) {
    const [updatedStats] = await db.update(userStats)
      .set(statsData)
      .where(eq(userStats.userId, userId))
      .returning();
    
    return updatedStats;
  }

  /**
   * Gang Operations
   */
  
  // Get gang by ID
  async getGang(id: number) {
    const [gang] = await db.select().from(gangs).where(eq(gangs.id, id));
    return gang;
  }

  // Get gang by name
  async getGangByName(name: string) {
    const [gang] = await db.select().from(gangs).where(eq(gangs.name, name));
    return gang;
  }

  // Create a new gang
  async createGang(gangData: any) {
    const [gang] = await db.insert(gangs).values(gangData).returning();
    return gang;
  }

  // Update gang data
  async updateGang(id: number, gangData: any) {
    const [updatedGang] = await db.update(gangs)
      .set(gangData)
      .where(eq(gangs.id, id))
      .returning();
    
    return updatedGang;
  }

  // Delete gang
  async deleteGang(id: number) {
    const [gang] = await db.delete(gangs)
      .where(eq(gangs.id, id))
      .returning();
    
    return gang;
  }

  // Get all gangs
  async getAllGangs() {
    return await db.select().from(gangs);
  }

  // Get gang members
  async getGangMembers(gangId: number) {
    return await db.select()
      .from(gangMembers)
      .where(eq(gangMembers.gangId, gangId));
  }

  // Add member to gang
  async addGangMember(memberData: any) {
    const [member] = await db.insert(gangMembers)
      .values(memberData)
      .returning();
    
    return member;
  }

  // Remove member from gang
  async removeGangMember(userId: number, gangId: number) {
    const [member] = await db.delete(gangMembers)
      .where(
        and(
          eq(gangMembers.userId, userId),
          eq(gangMembers.gangId, gangId)
        )
      )
      .returning();
    
    return member;
  }

  // Update gang member
  async updateGangMember(userId: number, gangId: number, data: any) {
    const [updatedMember] = await db.update(gangMembers)
      .set(data)
      .where(
        and(
          eq(gangMembers.userId, userId),
          eq(gangMembers.gangId, gangId)
        )
      )
      .returning();
    
    return updatedMember;
  }

  // Get user's gang
  async getUserGang(userId: number) {
    const [member] = await db.select()
      .from(gangMembers)
      .where(eq(gangMembers.userId, userId));
    
    if (!member) return null;
    
    const [gang] = await db.select()
      .from(gangs)
      .where(eq(gangs.id, member.gangId));
    
    return gang;
  }

  /**
   * Messaging System
   */
  
  // Send a message
  async sendMessage(messageData: any) {
    const [message] = await db.insert(messages)
      .values(messageData)
      .returning();
    
    return message;
  }

  // Get messages for a user
  async getUserMessages(userId: number) {
    return await db.select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.timestamp));
  }

  // Get messages between two users
  async getMessagesBetweenUsers(user1Id: number, user2Id: number) {
    return await db.select()
      .from(messages)
      .where(
        and(
          or(
            eq(messages.senderId, user1Id),
            eq(messages.senderId, user2Id)
          ),
          or(
            eq(messages.receiverId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          eq(messages.type, 'direct')
        )
      )
      .orderBy(asc(messages.timestamp));
  }

  // Get gang messages
  async getGangMessages(gangId: number) {
    return await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.gangId, gangId),
          eq(messages.type, 'gang')
        )
      )
      .orderBy(asc(messages.timestamp));
  }

  // Mark message as read
  async markMessageAsRead(messageId: number) {
    await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId));
    
    return true;
  }

  // Get unread message count
  async getUnreadMessageCount(userId: number) {
    const [result] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.read, false)
      )
    );
    
    return result.count;
  }

  /**
   * Friend System
   */
  
  // Get user's friends
  async getUserFriends(userId: number) {
    const friendships = await db.select({
      friendId: friends.friendId
    })
    .from(friends)
    .where(eq(friends.userId, userId));
    
    const friendIds = friendships.map(f => f.friendId);
    
    if (friendIds.length === 0) return [];
    
    return await db.select()
      .from(users)
      .where(inArray(users.id, friendIds));
  }

  // Check if users are friends
  async areFriends(user1Id: number, user2Id: number) {
    const [friendship] = await db.select()
      .from(friends)
      .where(
        or(
          and(
            eq(friends.userId, user1Id),
            eq(friends.friendId, user2Id)
          ),
          and(
            eq(friends.userId, user2Id),
            eq(friends.friendId, user1Id)
          )
        )
      );
    
    return !!friendship;
  }

  // Send friend request
  async sendFriendRequest(senderId: number, receiverId: number) {
    // Check if there's already a friend request
    const [existingRequest] = await db.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.senderId, senderId),
          eq(friendRequests.receiverId, receiverId)
        )
      );
    
    if (existingRequest) return existingRequest;
    
    // Create new friend request
    const [request] = await db.insert(friendRequests)
      .values({
        senderId,
        receiverId,
        status: 'pending',
        createdAt: new Date()
      })
      .returning();
    
    return request;
  }

  // Get pending friend requests
  async getPendingFriendRequests(userId: number) {
    return await db.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.receiverId, userId),
          eq(friendRequests.status, 'pending')
        )
      );
  }

  // Accept friend request
  async acceptFriendRequest(requestId: number) {
    // Get the request
    const [request] = await db.select()
      .from(friendRequests)
      .where(eq(friendRequests.id, requestId));
    
    if (!request) return null;
    
    // Update request status
    await db.update(friendRequests)
      .set({ status: 'accepted' })
      .where(eq(friendRequests.id, requestId));
    
    // Create friend connections (both ways)
    await db.insert(friends)
      .values({
        userId: request.senderId,
        friendId: request.receiverId
      });
    
    await db.insert(friends)
      .values({
        userId: request.receiverId,
        friendId: request.senderId
      });
    
    return request;
  }

  // Reject friend request
  async rejectFriendRequest(requestId: number) {
    await db.update(friendRequests)
      .set({ status: 'rejected' })
      .where(eq(friendRequests.id, requestId));
    
    return true;
  }

  // Remove friend
  async removeFriend(userId: number, friendId: number) {
    // Delete both friendship records
    await db.delete(friends)
      .where(
        or(
          and(
            eq(friends.userId, userId),
            eq(friends.friendId, friendId)
          ),
          and(
            eq(friends.userId, friendId),
            eq(friends.friendId, userId)
          )
        )
      );
    
    return true;
  }

  /**
   * Achievement System
   */
  
  // Get all achievements
  async getAchievements() {
    return await db.select().from(achievements);
  }

  // Get achievement by ID
  async getAchievement(id: number) {
    const [achievement] = await db.select()
      .from(achievements)
      .where(eq(achievements.id, id));
    
    return achievement;
  }

  // Get user's achievement progress
  async getUserAchievementProgress(userId: number) {
    return await db.select()
      .from(achievementProgress)
      .where(eq(achievementProgress.userId, userId));
  }

  // Get user's achievement progress for specific achievement
  async getUserAchievementProgressForAchievement(userId: number, achievementId: number) {
    const [progress] = await db.select()
      .from(achievementProgress)
      .where(
        and(
          eq(achievementProgress.userId, userId),
          eq(achievementProgress.achievementId, achievementId)
        )
      );
    
    return progress;
  }

  // Update achievement progress
  async updateAchievementProgress(userId: number, achievementId: number, data: any) {
    // Check if progress exists
    const [existingProgress] = await db.select()
      .from(achievementProgress)
      .where(
        and(
          eq(achievementProgress.userId, userId),
          eq(achievementProgress.achievementId, achievementId)
        )
      );
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db.update(achievementProgress)
        .set(data)
        .where(
          and(
            eq(achievementProgress.userId, userId),
            eq(achievementProgress.achievementId, achievementId)
          )
        )
        .returning();
      
      return updatedProgress;
    } else {
      // Create new progress
      const [newProgress] = await db.insert(achievementProgress)
        .values({
          userId,
          achievementId,
          ...data
        })
        .returning();
      
      return newProgress;
    }
  }

  // Create or update achievement
  async createOrUpdateAchievement(achievementData: any) {
    if (achievementData.id) {
      // Update
      const [achievement] = await db.update(achievements)
        .set(achievementData)
        .where(eq(achievements.id, achievementData.id))
        .returning();
      
      return achievement;
    } else {
      // Create
      const [achievement] = await db.insert(achievements)
        .values(achievementData)
        .returning();
      
      return achievement;
    }
  }

  // Delete achievement
  async deleteAchievement(id: number) {
    const [achievement] = await db.delete(achievements)
      .where(eq(achievements.id, id))
      .returning();
    
    return achievement;
  }

  /**
   * Crime System
   */
  
  // This would be implemented similarly to the above methods
  // for the crime-related tables

  /**
   * Banking System
   */
  
  // This would be implemented similarly to the above methods
  // for the banking-related tables

  /**
   * Inventory System
   */
  
  // This would be implemented similarly to the above methods
  // for the inventory-related tables

  /**
   * Drug System
   */
  
  // This would be implemented similarly to the above methods
  // for the drug-related tables

  /**
   * Casino System
   */
  
  // This would be implemented similarly to the above methods
  // for the casino-related tables
}

// Create and export storage instance
export const storage = new SupabaseStorage();