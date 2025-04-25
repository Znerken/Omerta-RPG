import connectPg from "connect-pg-simple";
import session from "express-session";
import {
  User, InsertUser,
  Stat, InsertStat,
  Crime, InsertCrime,
  CrimeHistory, InsertCrimeHistory,
  Item, InsertItem,
  UserInventory, InsertUserInventory,
  Gang, InsertGang,
  GangMember, InsertGangMember,
  Message, InsertMessage,
  UserWithStats,
  UserWithGang,
  UserWithFinancials,
  CrimeWithHistory,
  ItemWithDetails,
  GangWithMembers,
  Challenge, InsertChallenge,
  ChallengeProgress, InsertChallengeProgress,
  ChallengeReward, InsertChallengeReward,
  ChallengeWithProgress,
  Achievement, InsertAchievement,
  UserAchievement, InsertUserAchievement,
  AchievementWithUnlocked,
  users,
  stats,
  crimes,
  crimeHistory,
  items,
  userInventory,
  gangs,
  gangMembers,
  messages,
  challenges,
  challengeProgress,
  challengeRewards,
  achievements,
  userAchievements
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql, asc } from "drizzle-orm";
import { db, pool } from "./db";
import { IStorage } from "./storage";
import { calculateCrimeSuccessChance } from "@shared/gameUtils";
import { EconomyStorage } from "./storage-economy";

const PostgresSessionStore = connectPg(session);

// Database storage implementation
export class DatabaseStorage extends EconomyStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    super(); // Initialize EconomyStorage
    
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true
    });
  }

  // Essential methods for authentication
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.username}) = LOWER(${username})`);
      return user;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return undefined;
    }
  }

  // Gang methods
  async getGang(id: number): Promise<Gang | undefined> {
    try {
      const [gang] = await db
        .select()
        .from(gangs)
        .where(eq(gangs.id, id));
      return gang;
    } catch (error) {
      console.error("Error in getGang:", error);
      return undefined;
    }
  }
  
  async getAllGangs(): Promise<Gang[]> {
    try {
      return await db
        .select()
        .from(gangs)
        .orderBy(desc(gangs.level));
    } catch (error) {
      console.error("Error in getAllGangs:", error);
      return [];
    }
  }

  async getTopGangs(limit: number = 10): Promise<Gang[]> {
    try {
      return await db
        .select()
        .from(gangs)
        .orderBy(desc(gangs.level))
        .limit(limit);
    } catch (error) {
      console.error("Error in getTopGangs:", error);
      return [];
    }
  }

  async getUserWithGang(userId: number): Promise<UserWithGang | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      const gangMember = await this.getGangMember(userId);
      if (!gangMember) {
        return { ...user, inGang: false };
      }
      
      return {
        ...user,
        inGang: true,
        gangId: gangMember.gangId,
        gang: gangMember.gang,
        gangMember,
        gangRank: gangMember.rank
      };
    } catch (error) {
      console.error("Error in getUserWithGang:", error);
      return undefined;
    }
  }
  
  // This method is used by the gang-routes.ts file
  async getGangWithMembers(gangId: number): Promise<any> {
    // We're reusing our existing method since it already includes members
    return this.getGangWithDetails(gangId);
  }
  
  // Used to check if a gang name already exists
  async getGangByName(name: string): Promise<Gang | undefined> {
    try {
      const [gang] = await db
        .select()
        .from(gangs)
        .where(sql`LOWER(${gangs.name}) = LOWER(${name})`);
      return gang;
    } catch (error) {
      console.error("Error in getGangByName:", error);
      return undefined;
    }
  }
  
  // Used to check if a gang tag already exists
  async getGangByTag(tag: string): Promise<Gang | undefined> {
    try {
      const [gang] = await db
        .select()
        .from(gangs)
        .where(sql`LOWER(${gangs.tag}) = LOWER(${tag})`);
      return gang;
    } catch (error) {
      console.error("Error in getGangByTag:", error);
      return undefined;
    }
  }
  
  // Add basic user profile method
  async getUserProfile(userId: number): Promise<any> {
    try {
      return this.getUserWithGang(userId);
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return undefined;
    }
  }
  
  // Add gang creation method
  async createGang(gangData: InsertGang): Promise<Gang | undefined> {
    try {
      const [gang] = await db
        .insert(gangs)
        .values(gangData)
        .returning();
      return gang;
    } catch (error) {
      console.error("Error in createGang:", error);
      return undefined;
    }
  }
  
  // Add gang member operations
  async addGangMember(memberData: InsertGangMember): Promise<GangMember | undefined> {
    try {
      const [member] = await db
        .insert(gangMembers)
        .values(memberData)
        .returning();
      return member;
    } catch (error) {
      console.error("Error in addGangMember:", error);
      return undefined;
    }
  }
  
  async removeGangMember(userId: number, gangId: number): Promise<boolean> {
    try {
      await db
        .delete(gangMembers)
        .where(
          and(
            eq(gangMembers.userId, userId),
            eq(gangMembers.gangId, gangId)
          )
        );
      return true;
    } catch (error) {
      console.error("Error in removeGangMember:", error);
      return false;
    }
  }
  
  // Update user method
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error("Error in updateUser:", error);
      return undefined;
    }
  }
  
  // Update gang method
  async updateGang(id: number, gangData: Partial<Gang>): Promise<Gang | undefined> {
    try {
      const [gang] = await db
        .update(gangs)
        .set(gangData)
        .where(eq(gangs.id, id))
        .returning();
      return gang;
    } catch (error) {
      console.error("Error in updateGang:", error);
      return undefined;
    }
  }
  
  // Add some achievement methods
  async getUnviewedAchievements(userId: number): Promise<AchievementWithUnlocked[]> {
    try {
      // This is a simplified version that just returns an empty array
      // since we don't have the full achievements implementation
      console.log(`Getting unviewed achievements for user ${userId}`);
      return [];
    } catch (error) {
      console.error("Error in getUnviewedAchievements:", error);
      return [];
    }
  }

  async getGangWithDetails(id: number): Promise<any | undefined> {
    try {
      console.log("Retrieving gang details for ID:", id);
      const gang = await this.getGang(id);
      if (!gang) {
        console.log("Gang not found with ID:", id);
        return undefined;
      }

      // Get gang members with contribution - use only fields we know exist
      const members = await db
        .select({
          id: users.id,
          username: users.username,
          level: users.level,
          respect: users.respect,
          avatar: users.avatar,
          createdAt: users.createdAt,
          isJailed: users.isJailed,
          jailTimeEnd: users.jailTimeEnd,
          rank: gangMembers.rank,
          contribution: gangMembers.contribution,
        })
        .from(gangMembers)
        .innerJoin(users, eq(gangMembers.userId, users.id))
        .where(eq(gangMembers.gangId, id));

      // Combine the data into the expected format - 
      // simplified to just include gang and members for now
      return {
        ...gang,
        members
      };
    } catch (error) {
      console.error("Error getting gang with details:", error);
      return undefined;
    }
  }

  // Gang Member methods
  async getGangMember(userId: number): Promise<(GangMember & { gang: Gang }) | undefined> {
    try {
      const [gangMember] = await db
        .select()
        .from(gangMembers)
        .where(eq(gangMembers.userId, userId));
      
      if (!gangMember) {
        console.log("No gang member found for user:", userId);
        return undefined;
      }
      
      const gang = await this.getGang(gangMember.gangId);
      if (!gang) {
        console.log("Gang not found for gang member:", gangMember);
        return undefined;
      }
      
      console.log("Found gang member:", { ...gangMember, gang });
      return { ...gangMember, gang };
    } catch (error) {
      console.error("Error in getGangMember:", error);
      return undefined;
    }
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();