import { 
  users, 
  gangMembers, 
  gangs, 
  friends, 
  messages,
  achievements,
  userAchievements,
  UserWithGang
} from '@shared/schema';
import { eq, and, desc, asc, isNull, inArray, gt, sql, not } from 'drizzle-orm';
import { db } from './db-supabase';
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  // User methods
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
  
  async getUserByEmail(email: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }
  
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

  async getUsersCount() {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
        
      return result[0].count;
    } catch (error) {
      console.error('Error getting users count:', error);
      return 0;
    }
  }
  
  async getUsers() {
    try {
      const result = await db
        .select()
        .from(users)
        .orderBy(asc(users.id));
        
      return result;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }
  
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
      return undefined;
    }
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string) {
    try {
      const [user] = await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, userId))
        .returning();
        
      return user;
    } catch (error) {
      console.error('Error updating Stripe customer ID:', error);
      return undefined;
    }
  }
  
  async deleteUser(id: number) {
    try {
      await db
        .delete(users)
        .where(eq(users.id, id));
        
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async getUserWithGang(userId: number): Promise<UserWithGang | undefined> {
    try {
      // First, get the user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
        
      if (!user) {
        return undefined;
      }
      
      // Check if the user is in a gang
      const gangId = user.gangId;
      
      // If user is not in a gang, return the user with gang set to null
      if (!gangId) {
        return {
          ...user,
          gang: null,
        };
      }
      
      // Get the gang details
      const [gang] = await db
        .select()
        .from(gangs)
        .where(eq(gangs.id, gangId))
        .limit(1);
        
      // Get gang members
      const members = await db
        .select({
          id: users.id,
          username: users.username,
          level: users.level,
          respect: users.respect,
          avatar: users.avatar,
          createdAt: users.createdAt,
          isJailed: users.jailStatus,
          jailTimeEnd: users.jailReleaseTime,
          rank: gangMembers.rank,
          contribution: gangMembers.contribution,
        })
        .from(users)
        .innerJoin(gangMembers, eq(users.id, gangMembers.userId))
        .where(eq(gangMembers.gangId, gangId))
        .orderBy(desc(gangMembers.contribution));
        
      // Return user with gang details
      return {
        ...user,
        gang: gang ? { ...gang, members } : null,
      };
    } catch (error) {
      console.error('Error fetching user with gang:', error);
      return undefined;
    }
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string }) {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          stripeCustomerId: stripeInfo.customerId,
          stripeSubscriptionId: stripeInfo.subscriptionId
        })
        .where(eq(users.id, userId))
        .returning();
        
      return user;
    } catch (error) {
      console.error('Error updating user Stripe info:', error);
      return undefined;
    }
  }
  
  // Friendship methods
  async getFriends(userId: number) {
    try {
      // Get friend relationships
      const relationships = await db
        .select({
          friendId: users.id,
          username: users.username,
          avatar: users.avatar,
          status: users.status,
          profileTheme: users.profileTheme,
          level: users.level,
          respect: users.respect,
          isOnline: sql<boolean>`case when ${users.lastSeen} > now() - interval '5 minutes' then true else false end`,
        })
        .from(friends)
        .innerJoin(users, eq(friends.friendId, users.id))
        .where(eq(friends.userId, userId));
        
      return relationships;
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  }
  
  async getFriendRequests(userId: number) {
    try {
      // Get pending friend requests
      const requests = await db
        .select({
          id: friends.id,
          userId: friends.userId,
          username: users.username,
          avatar: users.avatar,
          status: friends.status,
          createdAt: friends.createdAt,
        })
        .from(friends)
        .innerJoin(users, eq(friends.userId, users.id))
        .where(and(
          eq(friends.friendId, userId),
          eq(friends.status, 'pending')
        ));
        
      return requests;
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return [];
    }
  }
  
  async addFriend(userId: number, friendId: number) {
    try {
      const [relationship] = await db
        .insert(friends)
        .values({
          userId,
          friendId,
          status: 'pending',
          createdAt: new Date(),
        })
        .returning();
        
      return relationship;
    } catch (error) {
      console.error('Error adding friend:', error);
      return undefined;
    }
  }
  
  async acceptFriendRequest(userId: number, requestId: number) {
    try {
      // Update the request status
      const [request] = await db
        .update(friends)
        .set({ status: 'accepted' })
        .where(and(
          eq(friends.id, requestId),
          eq(friends.friendId, userId)
        ))
        .returning();
        
      if (!request) {
        return false;
      }
      
      // Create the reciprocal relationship
      await db
        .insert(friends)
        .values({
          userId,
          friendId: request.userId,
          status: 'accepted',
          createdAt: new Date(),
        });
        
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  }
  
  async rejectFriendRequest(userId: number, requestId: number) {
    try {
      await db
        .delete(friends)
        .where(and(
          eq(friends.id, requestId),
          eq(friends.friendId, userId)
        ));
        
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
  }
  
  async removeFriend(userId: number, friendId: number) {
    try {
      // Delete both directions of the relationship
      await db
        .delete(friends)
        .where(or(
          and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userId))
        ));
        
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  }
  
  // Messaging methods
  async getMessages(userId: number, otherUserId: number) {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(and(
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
          ),
          eq(messages.type, 'direct')
        ))
        .orderBy(asc(messages.timestamp));
        
      return result;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }
  
  async getUnreadMessageCounts(userId: number) {
    try {
      const result = await db
        .select({
          senderId: messages.senderId,
          count: sql<number>`count(*)`,
        })
        .from(messages)
        .where(and(
          eq(messages.receiverId, userId),
          eq(messages.read, false),
          eq(messages.type, 'direct')
        ))
        .groupBy(messages.senderId);
        
      return result;
    } catch (error) {
      console.error('Error getting unread message counts:', error);
      return [];
    }
  }
  
  async createMessage(messageData: any) {
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
      console.error('Error creating message:', error);
      return undefined;
    }
  }
  
  async markMessageAsRead(messageId: number) {
    try {
      await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, messageId));
        
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }
  
  async markAllMessagesAsRead(userId: number, otherUserId: number) {
    try {
      await db
        .update(messages)
        .set({ read: true })
        .where(and(
          eq(messages.receiverId, userId),
          eq(messages.senderId, otherUserId),
          eq(messages.read, false)
        ));
        
      return true;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return false;
    }
  }
  
  // Achievement methods
  async getAchievements() {
    try {
      const result = await db
        .select()
        .from(achievements)
        .orderBy(asc(achievements.id));
        
      return result;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }
  
  async getAchievement(id: number) {
    try {
      const [achievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, id))
        .limit(1);
        
      return achievement;
    } catch (error) {
      console.error('Error getting achievement:', error);
      return undefined;
    }
  }
  
  async getUserAchievements(userId: number) {
    try {
      const result = await db
        .select({
          id: achievements.id,
          title: achievements.title,
          description: achievements.description,
          icon: achievements.icon,
          reward: achievements.reward,
          category: achievements.category,
          series: achievements.series,
          difficulty: achievements.difficulty,
          progress: userAchievements.progress,
          claimed: userAchievements.claimed,
          completed: userAchievements.completed,
          completedAt: userAchievements.completedAt,
          viewed: userAchievements.viewed,
        })
        .from(achievements)
        .leftJoin(
          userAchievements,
          and(
            eq(achievements.id, userAchievements.achievementId),
            eq(userAchievements.userId, userId)
          )
        )
        .orderBy(asc(achievements.id));
        
      return result;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }
  
  // Add more methods from IStorage as needed
  
  // This is a stub implementation - you'll need to implement the rest of the methods
  sessionStore: any;
  
  // Gang methods
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
  
  async createGang(gangData: any) {
    try {
      const [gang] = await db
        .insert(gangs)
        .values({
          ...gangData,
          createdAt: new Date(),
          experience: 0,
          level: 1,
          respect: 0,
          strength: 10,
          defense: 10,
          bankBalance: 0,
        })
        .returning();
        
      // Also add the owner as a member
      await db
        .insert(gangMembers)
        .values({
          gangId: gang.id,
          userId: gangData.ownerId,
          rank: 'Boss',
          contribution: 0,
          joinedAt: new Date(),
        });
        
      return gang;
    } catch (error) {
      console.error('Error creating gang:', error);
      return undefined;
    }
  }
  
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
      return undefined;
    }
  }
  
  async deleteGang(id: number) {
    try {
      // First delete all gang members
      await db
        .delete(gangMembers)
        .where(eq(gangMembers.gangId, id));
        
      // Then delete the gang
      await db
        .delete(gangs)
        .where(eq(gangs.id, id));
        
      return true;
    } catch (error) {
      console.error('Error deleting gang:', error);
      return false;
    }
  }
  
  async addGangMember(memberData: any) {
    try {
      const [member] = await db
        .insert(gangMembers)
        .values({
          ...memberData,
          contribution: 0,
          joinedAt: new Date(),
          rank: memberData.rank || 'Member',
        })
        .returning();
        
      // Update the user's gangId
      await db
        .update(users)
        .set({ gangId: memberData.gangId })
        .where(eq(users.id, memberData.userId));
        
      return member;
    } catch (error) {
      console.error('Error adding gang member:', error);
      return undefined;
    }
  }
  
  async removeGangMember(gangId: number, userId: number) {
    try {
      // First remove the member
      await db
        .delete(gangMembers)
        .where(and(
          eq(gangMembers.gangId, gangId),
          eq(gangMembers.userId, userId)
        ));
        
      // Then update the user's gangId
      await db
        .update(users)
        .set({ gangId: null })
        .where(eq(users.id, userId));
        
      return true;
    } catch (error) {
      console.error('Error removing gang member:', error);
      return false;
    }
  }
  
  async updateGangMember(gangId: number, userId: number, data: any) {
    try {
      const [member] = await db
        .update(gangMembers)
        .set(data)
        .where(and(
          eq(gangMembers.gangId, gangId),
          eq(gangMembers.userId, userId)
        ))
        .returning();
        
      return member;
    } catch (error) {
      console.error('Error updating gang member:', error);
      return undefined;
    }
  }
  
  async getGangMembers(gangId: number) {
    try {
      const members = await db
        .select({
          id: users.id,
          username: users.username,
          level: users.level,
          respect: users.respect,
          avatar: users.avatar,
          createdAt: users.createdAt,
          isJailed: users.jailStatus,
          jailTimeEnd: users.jailReleaseTime,
          rank: gangMembers.rank,
          contribution: gangMembers.contribution,
        })
        .from(gangMembers)
        .innerJoin(users, eq(gangMembers.userId, users.id))
        .where(eq(gangMembers.gangId, gangId))
        .orderBy(desc(gangMembers.contribution));
        
      return members;
    } catch (error) {
      console.error('Error getting gang members:', error);
      return [];
    }
  }
}