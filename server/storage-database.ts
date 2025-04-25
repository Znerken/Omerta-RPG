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
  Achievement,
  UserAchievement,
  InsertUserAchievement,
  AchievementWithUnlocked,
  Challenge,
  ChallengeProgress,
  ChallengeWithProgress,
  CrimeWithHistory,
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
  
  async createUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
        
      if (!user) {
        throw new Error("Failed to create user");
      }
      
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw new Error("User creation failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  // Admin methods
  async getAllUsers(page: number = 1, limit: number = 20, search?: string): Promise<User[]> {
    try {
      const offset = (page - 1) * limit;
      
      let query = db.select().from(users);
      
      // Add search filter if provided
      if (search) {
        query = query.where(
          sql`LOWER(${users.username}) LIKE LOWER(${'%' + search + '%'}) OR LOWER(${users.email}) LIKE LOWER(${'%' + search + '%'})`
        );
      }
      
      // Add pagination
      query = query.limit(limit).offset(offset).orderBy(desc(users.id));
      
      return await query;
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return [];
    }
  }
  
  async getUserCount(search?: string): Promise<number> {
    try {
      let query = db.select({
        count: sql<number>`count(*)`
      }).from(users);
      
      // Add search filter if provided
      if (search) {
        query = query.where(
          sql`LOWER(${users.username}) LIKE LOWER(${'%' + search + '%'}) OR LOWER(${users.email}) LIKE LOWER(${'%' + search + '%'})`
        );
      }
      
      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error in getUserCount:", error);
      return 0;
    }
  }
  
  async getActiveUserCount(hoursAgo: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      
      const result = await db.select({
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(gte(users.lastLogin, cutoffTime));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error in getActiveUserCount:", error);
      return 0;
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${email})`);
      return user;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
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
      console.log(`[DEBUG] getUserWithGang called for userId: ${userId}`);
      
      const user = await this.getUser(userId);
      if (!user) {
        console.log(`[DEBUG] User with ID ${userId} not found`);
        return undefined;
      }
      console.log(`[DEBUG] Found user:`, user);
      
      // First check directly in the database 
      const [directMember] = await db
        .select()
        .from(gangMembers)
        .where(eq(gangMembers.userId, userId));
        
      console.log(`[DEBUG] Direct database query for gangMembers:`, directMember);
      
      // If user is in a gang based on direct query
      if (directMember) {
        // Get the gang details
        const [gangData] = await db
          .select()
          .from(gangs)
          .where(eq(gangs.id, directMember.gangId));
          
        // Return user with gang info
        console.log(`[DEBUG] User is in gang (direct query), returning user with gang info`);
        return {
          ...user,
          inGang: true,
          gangId: directMember.gangId,
          gang: gangData,
          gangRank: directMember.rank,
          gangMember: directMember
        };
      }
      
      // Now try through the method as a fallback
      const gangMember = await this.getGangMember(userId);
      console.log(`[DEBUG] getGangMember result:`, gangMember);
      
      if (!gangMember) {
        console.log(`[DEBUG] User with ID ${userId} is not in a gang`);
        // Return user without gang info
        return {
          ...user,
          inGang: false
        };
      }
      
      // Return user with gang info
      console.log(`[DEBUG] User is in gang via getGangMember, returning user with gang info`);
      return {
        ...user,
        inGang: true,
        gangId: gangMember.gangId,
        gang: gangMember.gang,
        gangRank: gangMember.rank,
        gangMember: gangMember
      };
    } catch (error) {
      console.error("Error in getUserWithGang:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack available");
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
  
  // Add statistics method for user
  async getUserWithStats(userId: number): Promise<UserWithStats | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      // Since we don't have a complete stats implementation yet,
      // we'll create a basic stats object
      const stats = {
        id: userId,
        userId: userId,
        strength: 10,
        stealth: 10,
        charisma: 10,
        intelligence: 10,
        strengthTrainingCooldown: null,
        stealthTrainingCooldown: null, 
        charismaTrainingCooldown: null,
        intelligenceTrainingCooldown: null,
      };
      
      return {
        ...user,
        stats
      };
    } catch (error) {
      console.error("Error in getUserWithStats:", error);
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
  
  // Achievement methods
  async getAchievementsWithUnlocked(userId: number): Promise<AchievementWithUnlocked[]> {
    try {
      // Get all achievements
      const allAchievements = await db
        .select()
        .from(achievements);
      
      // Get user's unlocked achievements
      const userAchievementResults = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));
      
      // Create a map for quick lookup
      const unlockedMap = new Map(
        userAchievementResults.map(ua => [ua.achievementId, ua])
      );
      
      // Combine data into the expected format
      return allAchievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedMap.has(achievement.id),
        unlockedAt: unlockedMap.get(achievement.id)?.unlockedAt,
        viewed: unlockedMap.get(achievement.id)?.viewed || false
      }));
    } catch (error) {
      console.error("Error in getAchievementsWithUnlocked:", error);
      return [];
    }
  }
  
  async getUnviewedAchievements(userId: number): Promise<AchievementWithUnlocked[]> {
    try {
      // This will get achievements that the user has unlocked but not viewed
      console.log(`Getting unviewed achievements for user ${userId}`);
      
      // Get user's unviewed achievements
      const userAchievementResults = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.viewed, false)
          )
        );
      
      if (userAchievementResults.length === 0) {
        return [];
      }
      
      // Get the full achievement details for each one
      const achievementIds = userAchievementResults.map(ua => ua.achievementId);
      const achievementResults = await db
        .select()
        .from(achievements)
        .where(sql`id = ANY(${achievementIds})`);
      
      // Create a map for quick lookup
      const userAchievementMap = new Map(
        userAchievementResults.map(ua => [ua.achievementId, ua])
      );
      
      // Combine data into the expected format
      return achievementResults.map(achievement => ({
        ...achievement,
        unlocked: true,
        unlockedAt: userAchievementMap.get(achievement.id)?.unlockedAt,
        viewed: false
      }));
    } catch (error) {
      console.error("Error in getUnviewedAchievements:", error);
      return [];
    }
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    try {
      const [achievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, id));
      return achievement;
    } catch (error) {
      console.error("Error in getAchievement:", error);
      return undefined;
    }
  }
  
  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    try {
      // Check if user already has this achievement
      const [existingAchievement] = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        );
      
      if (existingAchievement) {
        return existingAchievement;
      }
      
      // Create new achievement record
      const [userAchievement] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          viewed: false
        })
        .returning();
      
      return userAchievement;
    } catch (error) {
      console.error("Error in unlockAchievement:", error);
      return undefined;
    }
  }
  
  // Challenge methods
  async getAllChallenges(): Promise<Challenge[]> {
    try {
      return await db
        .select()
        .from(challenges)
        .orderBy(desc(challenges.startDate));
    } catch (error) {
      console.error("Error in getAllChallenges:", error);
      return [];
    }
  }
  
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const now = new Date();
      return await db
        .select()
        .from(challenges)
        .where(
          and(
            lte(challenges.startDate, now),
            // Check if the end date is in the future or null
            sql`(${challenges.endDate} IS NULL OR ${challenges.endDate} >= ${now})`
          )
        )
        .orderBy(desc(challenges.startDate));
    } catch (error) {
      console.error("Error in getActiveChallenges:", error);
      return [];
    }
  }
  
  async getChallenge(id: number): Promise<Challenge | undefined> {
    try {
      const [challenge] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, id));
      return challenge;
    } catch (error) {
      console.error("Error in getChallenge:", error);
      return undefined;
    }
  }
  
  async getChallengesWithProgress(userId: number): Promise<ChallengeWithProgress[]> {
    try {
      // Get active challenges
      const activeChallenges = await this.getActiveChallenges();
      
      // Get user's progress for all challenges
      const userProgressResults = await db
        .select()
        .from(challengeProgress)
        .where(eq(challengeProgress.userId, userId));
      
      // Create a map for quick lookup
      const progressMap = new Map(
        userProgressResults.map(p => [p.challengeId, p])
      );
      
      // Combine data into the expected format
      return activeChallenges.map(challenge => {
        const progress = progressMap.get(challenge.id);
        return {
          ...challenge,
          progress,
          completed: progress?.completed || false,
          claimed: progress?.claimed || false,
          currentValue: progress?.currentValue || 0
        };
      });
    } catch (error) {
      console.error("Error in getChallengesWithProgress:", error);
      return [];
    }
  }
  
  async getChallengeProgress(userId: number, challengeId: number): Promise<ChallengeProgress | undefined> {
    try {
      const [progress] = await db
        .select()
        .from(challengeProgress)
        .where(
          and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId)
          )
        );
      return progress;
    } catch (error) {
      console.error("Error in getChallengeProgress:", error);
      return undefined;
    }
  }
  
  async createChallengeProgress(progress: InsertChallengeProgress): Promise<ChallengeProgress> {
    try {
      const [result] = await db
        .insert(challengeProgress)
        .values(progress)
        .returning();
      
      if (!result) {
        throw new Error("Failed to create challenge progress");
      }
      
      return result;
    } catch (error) {
      console.error("Error in createChallengeProgress:", error);
      throw new Error("Challenge progress creation failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  async updateChallengeProgress(userId: number, challengeId: number, data: Partial<ChallengeProgress>): Promise<ChallengeProgress | undefined> {
    try {
      const [result] = await db
        .update(challengeProgress)
        .set(data)
        .where(
          and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      console.error("Error in updateChallengeProgress:", error);
      return undefined;
    }
  }
  
  // Crime-related methods
  async getAllCrimes(): Promise<Crime[]> {
    try {
      return await db
        .select()
        .from(crimes)
        .orderBy(asc(crimes.minCashReward));
    } catch (error) {
      console.error("Error in getAllCrimes:", error);
      return [];
    }
  }
  
  async getCrime(id: number): Promise<Crime | undefined> {
    try {
      const [crime] = await db
        .select()
        .from(crimes)
        .where(eq(crimes.id, id));
      return crime;
    } catch (error) {
      console.error("Error in getCrime:", error);
      return undefined;
    }
  }
  
  async getCrimesWithHistory(userId: number): Promise<CrimeWithHistory[]> {
    try {
      // Get all crimes
      const allCrimes = await this.getAllCrimes();
      
      // Get user's crime history
      const userHistoryResults = await db
        .select()
        .from(crimeHistory)
        .where(eq(crimeHistory.userId, userId))
        .orderBy(desc(crimeHistory.timestamp));
      
      // Create a map for quick lookup (get latest attempt per crime)
      const historyMap = new Map<number, CrimeHistory>();
      
      for (const history of userHistoryResults) {
        if (!historyMap.has(history.crimeId)) {
          historyMap.set(history.crimeId, history);
        }
      }
      
      // Get user stats
      const stats = await this.getStatsByUserId(userId);
      
      if (!stats) {
        return allCrimes.map(crime => ({
          ...crime,
          lastPerformed: undefined,
          successChance: 0,
        }));
      }
      
      // Combine data into the expected format
      return allCrimes.map(crime => {
        const lastPerformed = historyMap.get(crime.id);
        
        // Calculate success chance based on user stats and crime weights
        const successChance = this.calculateCrimeSuccessChance(crime, stats);
        
        return {
          ...crime,
          lastPerformed,
          successChance
        };
      });
    } catch (error) {
      console.error("Error in getCrimesWithHistory:", error);
      return [];
    }
  }
  
  // Helper function to calculate crime success chance
  calculateCrimeSuccessChance(crime: Crime, stats: Stat): number {
    const strengthFactor = (stats.strength / 100) * crime.strengthWeight;
    const stealthFactor = (stats.stealth / 100) * crime.stealthWeight;
    const charismaFactor = (stats.charisma / 100) * crime.charismaWeight;
    const intelligenceFactor = (stats.intelligence / 100) * crime.intelligenceWeight;
    
    const successChance = Math.min(
      95, // Cap at 95%
      Math.round((strengthFactor + stealthFactor + charismaFactor + intelligenceFactor) * 100)
    );
    
    return successChance;
  }
  
  async getCrimeHistoryByUserId(userId: number, limit: number = 10): Promise<CrimeHistory[]> {
    try {
      const historyResults = await db
        .select()
        .from(crimeHistory)
        .where(eq(crimeHistory.userId, userId))
        .orderBy(desc(crimeHistory.timestamp))
        .limit(limit);
      
      return historyResults;
    } catch (error) {
      console.error("Error in getCrimeHistoryByUserId:", error);
      return [];
    }
  }
  
  async createCrimeHistory(crimeHistoryData: InsertCrimeHistory): Promise<CrimeHistory> {
    try {
      const [result] = await db
        .insert(crimeHistory)
        .values(crimeHistoryData)
        .returning();
      
      if (!result) {
        throw new Error("Failed to create crime history");
      }
      
      return result;
    } catch (error) {
      console.error("Error in createCrimeHistory:", error);
      throw new Error("Crime history creation failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  // Stats-related methods
  async getStatsByUserId(userId: number): Promise<Stat | undefined> {
    try {
      const [statResult] = await db
        .select()
        .from(stats)
        .where(eq(stats.userId, userId));
      
      // If stats don't exist for this user, create default stats
      if (!statResult) {
        // Create default stats for this user
        const defaultStats = {
          userId,
          strength: 10,
          stealth: 10,
          charisma: 10,
          intelligence: 10,
          strengthTrainingCooldown: null,
          stealthTrainingCooldown: null,
          charismaTrainingCooldown: null,
          intelligenceTrainingCooldown: null
        };
        
        const [newStats] = await db
          .insert(stats)
          .values(defaultStats)
          .returning();
        
        return newStats;
      }
      
      return statResult;
    } catch (error) {
      console.error("Error in getStatsByUserId:", error);
      return undefined;
    }
  }
  
  async updateStats(userId: number, statData: Partial<Stat>): Promise<Stat | undefined> {
    try {
      const [result] = await db
        .update(stats)
        .set(statData)
        .where(eq(stats.userId, userId))
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error in updateStats:", error);
      return undefined;
    }
  }
  
  // Message-related methods
  async getUserMessages(userId: number, limit: number = 50): Promise<Message[]> {
    try {
      return await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.type, 'personal')
          )
        )
        .orderBy(desc(messages.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("Error in getUserMessages:", error);
      return [];
    }
  }
  
  async getGangMessages(gangId: number, limit: number = 50): Promise<Message[]> {
    try {
      return await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.gangId, gangId),
            eq(messages.type, 'gang')
          )
        )
        .orderBy(desc(messages.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("Error in getGangMessages:", error);
      return [];
    }
  }
  
  async getJailMessages(limit: number = 50): Promise<Message[]> {
    try {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.type, 'jail'))
        .orderBy(desc(messages.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("Error in getJailMessages:", error);
      return [];
    }
  }
  
  async getGlobalMessages(limit: number = 50): Promise<Message[]> {
    try {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.type, 'global'))
        .orderBy(desc(messages.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("Error in getGlobalMessages:", error);
      return [];
    }
  }
  
  async getUnreadMessages(userId: number): Promise<Message[]> {
    try {
      return await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.read, false),
            eq(messages.type, 'personal')
          )
        )
        .orderBy(desc(messages.timestamp));
    } catch (error) {
      console.error("Error in getUnreadMessages:", error);
      return [];
    }
  }
  
  async markMessageAsRead(messageId: number): Promise<boolean> {
    try {
      await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, messageId));
      return true;
    } catch (error) {
      console.error("Error in markMessageAsRead:", error);
      return false;
    }
  }
  
  async markAllMessagesAsRead(userId: number): Promise<boolean> {
    try {
      await db
        .update(messages)
        .set({ read: true })
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.read, false),
            eq(messages.type, 'personal')
          )
        );
      return true;
    } catch (error) {
      console.error("Error in markAllMessagesAsRead:", error);
      return false;
    }
  }
  
  async createMessage(messageData: Omit<InsertMessage, 'timestamp'>): Promise<Message> {
    try {
      // Set default values if not provided
      if (messageData.type === 'personal' && !messageData.receiverId) {
        throw new Error("receiverId is required for personal messages");
      }
      
      if (messageData.type === 'gang' && !messageData.gangId) {
        throw new Error("gangId is required for gang messages");
      }
      
      const [message] = await db
        .insert(messages)
        .values(messageData)
        .returning();
      
      if (!message) {
        throw new Error("Failed to create message");
      }
      
      return message;
    } catch (error) {
      console.error("Error in createMessage:", error);
      throw new Error("Message creation failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  async deleteMessage(messageId: number): Promise<boolean> {
    try {
      await db
        .delete(messages)
        .where(eq(messages.id, messageId));
      return true;
    } catch (error) {
      console.error("Error in deleteMessage:", error);
      return false;
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
      console.log(`[DEBUG] getGangMember called for userId: ${userId}`);
      // The column in the database is userId, not user_id
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