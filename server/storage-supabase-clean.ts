import { supabase, db } from './db-supabase';
import { 
  users, 
  userStats, 
  gangs, 
  gangMembers, 
  messages,
  items,
  userInventory,
  type User,
  type UserStats
} from '@shared/schema';
import { eq, and, or, desc, asc, sql } from 'drizzle-orm';

/**
 * Storage interface for interacting with the database
 */
export class SupabaseStorage {
  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.username, username)
      });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.supabaseId, supabaseId)
      });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      throw error;
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData as any)
        .returning();
      
      if (!user) {
        throw new Error('Failed to create user');
      }

      // Create initial stats for the user
      await db.insert(userStats)
        .values({
          userId: user.id,
          strength: 10,
          stealth: 10,
          charisma: 10,
          intelligence: 10
        });
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(updates as any)
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserStatus(id: number, status: string): Promise<User> {
    try {
      return await this.updateUser(id, {
        status: status,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Get the user to find Supabase ID
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }
      
      // Delete from game database
      const result = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      if (result.length === 0) {
        return false;
      }
      
      // If there's a Supabase ID, delete from Supabase Auth as well
      if (user.supabaseId) {
        try {
          await supabase.auth.admin.deleteUser(user.supabaseId);
        } catch (error) {
          console.error('Error deleting Supabase user:', error);
          // Continue anyway as the game user is already deleted
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAllUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    try {
      const allUsers = await db.query.users.findMany({
        limit,
        offset,
        orderBy: asc(users.id)
      });
      
      return allUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // USER STATS METHODS
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    try {
      const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId)
      });
      
      return stats || undefined;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async updateUserStats(userId: number, updates: Partial<UserStats>): Promise<UserStats> {
    try {
      const [updatedStats] = await db
        .update(userStats)
        .set(updates as any)
        .where(eq(userStats.userId, userId))
        .returning();
      
      if (!updatedStats) {
        throw new Error('User stats not found');
      }
      
      return updatedStats;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // GANG METHODS
  async createGang(name: string, description: string, founderId: number): Promise<any> {
    try {
      // Create the gang
      const [gang] = await db
        .insert(gangs)
        .values({
          name,
          description,
          createdAt: new Date()
        })
        .returning();
      
      if (!gang) {
        throw new Error('Failed to create gang');
      }
      
      // Add founder as first member with rank "Leader"
      const [member] = await db
        .insert(gangMembers)
        .values({
          gangId: gang.id,
          userId: founderId,
          rank: 'Leader',
          joinedAt: new Date()
        })
        .returning();
      
      return {
        ...gang,
        members: [member]
      };
    } catch (error) {
      console.error('Error creating gang:', error);
      throw error;
    }
  }

  async getGang(id: number): Promise<any> {
    try {
      const gang = await db.query.gangs.findFirst({
        where: eq(gangs.id, id)
      });
      
      if (!gang) {
        return undefined;
      }
      
      // Get gang members
      const members = await db.query.gangMembers.findMany({
        where: eq(gangMembers.gangId, id),
        with: {
          user: true
        }
      });
      
      return {
        ...gang,
        members
      };
    } catch (error) {
      console.error('Error getting gang:', error);
      throw error;
    }
  }

  async getUserGang(userId: number): Promise<any> {
    try {
      const membership = await db.query.gangMembers.findFirst({
        where: eq(gangMembers.userId, userId),
        with: {
          gang: true
        }
      });
      
      if (!membership) {
        return undefined;
      }
      
      // Get all gang members
      const members = await db.query.gangMembers.findMany({
        where: eq(gangMembers.gangId, membership.gangId),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              level: true,
              avatar: true,
              respect: true
            }
          }
        }
      });
      
      return {
        ...membership.gang,
        members,
        userRank: membership.rank
      };
    } catch (error) {
      console.error('Error getting user gang:', error);
      throw error;
    }
  }

  // MESSAGING METHODS
  async sendMessage(senderId: number, content: string, options: {
    receiverId?: number;
    gangId?: number;
    type?: string;
  }): Promise<any> {
    try {
      const { receiverId, gangId, type = 'direct' } = options;
      
      // Validate message based on type
      if (type === 'direct' && !receiverId) {
        throw new Error('Receiver ID is required for direct messages');
      } else if (type === 'gang' && !gangId) {
        throw new Error('Gang ID is required for gang messages');
      }
      
      const [message] = await db
        .insert(messages)
        .values({
          senderId,
          receiverId: receiverId || null,
          gangId: gangId || null,
          content,
          type,
          read: false,
          timestamp: new Date()
        })
        .returning();
      
      if (!message) {
        throw new Error('Failed to send message');
      }
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getUserMessages(userId: number, options: {
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      const { type, limit = 50, offset = 0 } = options;
      
      let query = db.select()
        .from(messages)
        .where(
          or(
            eq(messages.receiverId, userId),
            eq(messages.senderId, userId)
          )
        )
        .orderBy(desc(messages.timestamp))
        .limit(limit)
        .offset(offset);
      
      if (type) {
        query = query.where(eq(messages.type, type));
      }
      
      const userMessages = await query;
      
      // Get user details for senders and receivers
      const userIds = new Set<number>();
      userMessages.forEach(msg => {
        if (msg.senderId) userIds.add(msg.senderId);
        if (msg.receiverId) userIds.add(msg.receiverId);
      });
      
      const userDetails = await db.query.users.findMany({
        where: sql`id IN (${Array.from(userIds).join(',')})`,
        columns: {
          id: true,
          username: true,
          avatar: true
        }
      });
      
      const userMap = Object.fromEntries(
        userDetails.map(user => [user.id, user])
      );
      
      // Enhance messages with user details
      return userMessages.map(msg => ({
        ...msg,
        sender: msg.senderId ? userMap[msg.senderId] : null,
        receiver: msg.receiverId ? userMap[msg.receiverId] : null
      }));
    } catch (error) {
      console.error('Error getting user messages:', error);
      throw error;
    }
  }

  // INVENTORY METHODS
  async getUserInventory(userId: number): Promise<any[]> {
    try {
      const inventory = await db.query.userInventory.findMany({
        where: eq(userInventory.userId, userId),
        with: {
          item: true
        }
      });
      
      return inventory;
    } catch (error) {
      console.error('Error getting user inventory:', error);
      throw error;
    }
  }

  async addItemToInventory(userId: number, itemId: number, quantity: number = 1): Promise<any> {
    try {
      // Check if user already has this item
      const existing = await db.query.userInventory.findFirst({
        where: and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      });
      
      if (existing) {
        // Update quantity
        const [updated] = await db
          .update(userInventory)
          .set({
            quantity: existing.quantity + quantity
          })
          .where(eq(userInventory.id, existing.id))
          .returning();
        
        return updated;
      } else {
        // Add new item to inventory
        const [newItem] = await db
          .insert(userInventory)
          .values({
            userId,
            itemId,
            quantity
          })
          .returning();
        
        return newItem;
      }
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      throw error;
    }
  }

  async removeItemFromInventory(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    try {
      // Check if user has this item
      const existing = await db.query.userInventory.findFirst({
        where: and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      });
      
      if (!existing || existing.quantity < quantity) {
        return false;
      }
      
      if (existing.quantity === quantity) {
        // Remove item entirely
        await db
          .delete(userInventory)
          .where(eq(userInventory.id, existing.id));
      } else {
        // Update quantity
        await db
          .update(userInventory)
          .set({
            quantity: existing.quantity - quantity
          })
          .where(eq(userInventory.id, existing.id));
      }
      
      return true;
    } catch (error) {
      console.error('Error removing item from inventory:', error);
      throw error;
    }
  }

  // FRIEND METHODS
  async getFriends(userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          u.id, 
          u.username, 
          u.level, 
          u.avatar, 
          u.status,
          u.last_seen AS "lastSeen"
        FROM users u
        JOIN user_friends uf ON u.id = uf.friend_id
        WHERE uf.user_id = $1
        ORDER BY u.username ASC
      `;
      
      const result = await db.execute(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  async addFriend(userId: number, friendId: number): Promise<boolean> {
    try {
      if (userId === friendId) {
        return false;
      }
      
      // Check if friendship already exists
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM user_friends 
          WHERE user_id = $1 AND friend_id = $2
        )
      `;
      
      const result = await db.execute(query, [userId, friendId]);
      const exists = result.rows[0]?.exists;
      
      if (exists) {
        return false;
      }
      
      // Add friendship (both ways for mutual friendship)
      await db.execute(`
        INSERT INTO user_friends (user_id, friend_id) 
        VALUES ($1, $2), ($2, $1)
      `, [userId, friendId]);
      
      return true;
    } catch (error) {
      console.error('Error adding friend:', error);
      throw error;
    }
  }

  async removeFriend(userId: number, friendId: number): Promise<boolean> {
    try {
      // Remove friendship (both ways)
      const query = `
        DELETE FROM user_friends 
        WHERE (user_id = $1 AND friend_id = $2) 
           OR (user_id = $2 AND friend_id = $1)
      `;
      
      await db.execute(query, [userId, friendId]);
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }
}

// Create and export the storage instance
export const storage = new SupabaseStorage();