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

  // Here we'll add just one method to test the syntax
  async getGangWithDetails(id: number): Promise<any | undefined> {
    try {
      console.log("Retrieving gang details for ID:", id);
      const gang = await this.getGang(id);
      if (!gang) {
        console.log("Gang not found with ID:", id);
        return undefined;
      }

      // Simplest implementation to test syntax
      return gang;
    } catch (error) {
      console.error("Error getting gang with details:", error);
      return undefined;
    }
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();