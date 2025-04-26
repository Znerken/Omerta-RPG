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
  UserWithStatus,
  UserStatus, InsertUserStatus,
  UserFriend, InsertUserFriend,
  Achievement, InsertAchievement,
  UserAchievement, InsertUserAchievement,
  AchievementWithUnlocked,
  Challenge, InsertChallenge,
  ChallengeProgress, InsertChallengeProgress,
  ChallengeReward, InsertChallengeReward,
  ChallengeWithProgress,
  CrimeWithHistory,
  ItemWithDetails,
  GangWithMembers,
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
  userAchievements,
  userStatus,
  userFriends
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql, asc, inArray } from "drizzle-orm";
import { db, pool } from "./db";
import { IStorage } from "./storage";
import { calculateCrimeSuccessChance } from "@shared/gameUtils";
import { EconomyStorage } from "./storage-economy";
import {
  getUserFriends,
  getFriendRequest,
  sendFriendRequest,
  updateFriendRequest,
  removeFriend,
  getUserStatus,
  getUserWithStatus,
  createUserStatus,
  updateUserStatus,
  getOnlineUsers
} from "./social-database";

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
      
      // The 'lastLogin' field doesn't seem to exist in the users table
      // Use a simpler query that just counts all users for now
      const result = await db.select({
        count: sql<number>`count(*)`
      })
      .from(users);
      
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
      
      // Get the actual stats for this user from the database
      const userStats = await this.getStatsByUserId(userId);
      
      // If for some reason stats don't exist (should be handled by getStatsByUserId),
      // we'll create default stats with 100 for the extortionist user (per requirement)
      const stats = userStats || {
        id: userId,
        userId: userId,
        strength: userId === 1 ? 100 : 10, // 100 for extortionist (user ID 1)
        stealth: userId === 1 ? 100 : 10,
        charisma: userId === 1 ? 100 : 10,
        intelligence: userId === 1 ? 100 : 10,
        strengthTrainingCooldown: null,
        stealthTrainingCooldown: null, 
        charismaTrainingCooldown: null,
        intelligenceTrainingCooldown: null,
      };
      
      // Log for debugging
      console.log(`[DEBUG] getUserWithStats for userId ${userId}:`, stats);
      
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
      
      // Use in operator instead of ANY to avoid array formatting issues
      let achievementResults;
      if (achievementIds.length > 0) {
        achievementResults = await db
          .select()
          .from(achievements)
          .where(inArray(achievements.id, achievementIds));
      } else {
        achievementResults = [];
      }
      
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
  
  async markAchievementAsViewed(userId: number, achievementId: number): Promise<boolean> {
    try {
      // Find the user achievement record
      const [existingAchievement] = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        );
      
      if (!existingAchievement) {
        console.log(`Achievement ${achievementId} not found for user ${userId}`);
        return false;
      }
      
      // Update the viewed status
      const [updatedAchievement] = await db
        .update(userAchievements)
        .set({ viewed: true })
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        )
        .returning();
      
      console.log(`Marked achievement ${achievementId} as viewed for user ${userId}`);
      return !!updatedAchievement;
    } catch (error) {
      console.error("Error in markAchievementAsViewed:", error);
      return false;
    }
  }
  
  // Create a new achievement
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    try {
      const [achievement] = await db
        .insert(achievements)
        .values(achievementData)
        .returning();
      
      return achievement;
    } catch (error) {
      console.error("Error in createAchievement:", error);
      throw error;
    }
  }
  
  // Update an achievement
  async updateAchievement(id: number, achievementData: Partial<Achievement>): Promise<Achievement | undefined> {
    try {
      const [updatedAchievement] = await db
        .update(achievements)
        .set(achievementData)
        .where(eq(achievements.id, id))
        .returning();
      
      return updatedAchievement;
    } catch (error) {
      console.error("Error in updateAchievement:", error);
      return undefined;
    }
  }
  
  // Delete an achievement
  async deleteAchievement(id: number): Promise<boolean> {
    try {
      // Delete achievement progress records
      await db
        .delete(achievementProgress)
        .where(eq(achievementProgress.achievementId, id));
      
      // Delete user achievement records
      await db
        .delete(userAchievements)
        .where(eq(userAchievements.achievementId, id));
      
      // Delete the achievement
      const result = await db
        .delete(achievements)
        .where(eq(achievements.id, id));
      
      return result.count > 0;
    } catch (error) {
      console.error("Error in deleteAchievement:", error);
      return false;
    }
  }
  
  // Get achievement progress for a user
  async getAchievementProgress(userId: number, achievementId: number): Promise<AchievementProgress | undefined> {
    try {
      const [progress] = await db
        .select()
        .from(achievementProgress)
        .where(
          and(
            eq(achievementProgress.userId, userId),
            eq(achievementProgress.achievementId, achievementId)
          )
        );
      
      return progress;
    } catch (error) {
      console.error("Error in getAchievementProgress:", error);
      return undefined;
    }
  }
  
  // Update achievement progress
  async updateAchievementProgress(userId: number, achievementId: number, value: number): Promise<AchievementProgress> {
    try {
      // Check if a progress record already exists
      const existingProgress = await this.getAchievementProgress(userId, achievementId);
      
      if (existingProgress) {
        // If it exists, update it
        const [updatedProgress] = await db
          .update(achievementProgress)
          .set({ 
            currentValue: value,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(achievementProgress.userId, userId),
              eq(achievementProgress.achievementId, achievementId)
            )
          )
          .returning();
        
        return updatedProgress;
      } else {
        // If it doesn't exist, create a new record
        const [newProgress] = await db
          .insert(achievementProgress)
          .values({
            userId,
            achievementId,
            currentValue: value
          })
          .returning();
        
        return newProgress;
      }
    } catch (error) {
      console.error("Error in updateAchievementProgress:", error);
      throw error;
    }
  }
  
  // Claim rewards for an achievement
  async claimAchievementRewards(userId: number, achievementId: number): Promise<boolean> {
    try {
      // Find the user achievement record
      const [userAchievement] = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        );
      
      if (!userAchievement || userAchievement.rewardsClaimed) {
        return false; // Achievement not found or rewards already claimed
      }
      
      // Get the achievement details to determine rewards
      const achievement = await this.getAchievement(achievementId);
      if (!achievement) {
        return false;
      }
      
      // Start a transaction to handle all reward operations
      await db.transaction(async (tx) => {
        // Mark rewards as claimed
        await tx
          .update(userAchievements)
          .set({ rewardsClaimed: true })
          .where(eq(userAchievements.id, userAchievement.id));
        
        // Get user's current stats
        const user = await this.getUser(userId);
        if (!user) {
          throw new Error("User not found");
        }
        
        // Update cash if there's a cash reward
        if (achievement.cashReward > 0) {
          await tx
            .update(users)
            .set({ cash: user.cash + achievement.cashReward })
            .where(eq(users.id, userId));
        }
        
        // Update respect if there's a respect reward
        if (achievement.respectReward > 0) {
          await tx
            .update(users)
            .set({ respect: user.respect + achievement.respectReward })
            .where(eq(users.id, userId));
        }
        
        // Update user XP
        if (achievement.xpReward > 0) {
          await tx
            .update(users)
            .set({ xp: user.xp + achievement.xpReward })
            .where(eq(users.id, userId));
          
          // Check if user should level up (simplified logic)
          const newXp = user.xp + achievement.xpReward;
          const newLevel = Math.floor(Math.sqrt(newXp) / 10) + 1;
          
          if (newLevel > user.level) {
            await tx
              .update(users)
              .set({ level: newLevel })
              .where(eq(users.id, userId));
          }
        }
        
        // If there's an item reward, add it to the user's inventory
        if (achievement.itemRewardId) {
          // Check if user already has this item
          const [existingItem] = await tx
            .select()
            .from(userInventory)
            .where(
              and(
                eq(userInventory.userId, userId),
                eq(userInventory.itemId, achievement.itemRewardId)
              )
            );
          
          if (existingItem) {
            // Increment quantity
            await tx
              .update(userInventory)
              .set({ quantity: existingItem.quantity + 1 })
              .where(eq(userInventory.id, existingItem.id));
          } else {
            // Add new item to inventory
            await tx
              .insert(userInventory)
              .values({
                userId: userId,
                itemId: achievement.itemRewardId,
                quantity: 1,
                equipped: false
              });
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error in claimAchievementRewards:", error);
      return false;
    }
  }
  
  // Check and update achievement progress for an action
  async checkAndUpdateAchievementProgress(
    userId: number, 
    type: string, 
    target?: string, 
    value: number = 1
  ): Promise<Achievement[]> {
    try {
      // Find relevant achievements for this action type
      const relevantAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.requirementType, type));
      
      if (relevantAchievements.length === 0) {
        return []; // No achievements found for this action type
      }
      
      // Filter achievements by target if provided
      const filteredAchievements = target 
        ? relevantAchievements.filter(a => a.requirementTarget === target)
        : relevantAchievements;
      
      if (filteredAchievements.length === 0) {
        return []; // No achievements match the target
      }
      
      // Get currently unlocked achievements for this user
      const unlockedAchievementIds = (await db
        .select({ id: userAchievements.achievementId })
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId)))
        .map(a => a.id);
      
      // Filter out already unlocked achievements
      const availableAchievements = filteredAchievements.filter(
        a => !unlockedAchievementIds.includes(a.id)
      );
      
      if (availableAchievements.length === 0) {
        return []; // All relevant achievements are already unlocked
      }
      
      const newlyUnlockedAchievements: Achievement[] = [];
      
      // Check each achievement and update progress
      for (const achievement of availableAchievements) {
        // Check prerequisites if there are any
        if (achievement.dependsOn && !unlockedAchievementIds.includes(achievement.dependsOn)) {
          continue; // Skip if prerequisite not met
        }
        
        // Get current progress or create if not exists
        let progress = await this.getAchievementProgress(userId, achievement.id);
        
        if (!progress) {
          // Initialize progress
          progress = await this.updateAchievementProgress(userId, achievement.id, value);
        } else {
          // Update progress
          const newValue = progress.currentValue + value;
          progress = await this.updateAchievementProgress(userId, achievement.id, newValue);
        }
        
        // Check if achievement should be unlocked
        if (progress.currentValue >= achievement.requirementValue) {
          const userAchievement = await this.unlockAchievement(userId, achievement.id);
          if (userAchievement) {
            newlyUnlockedAchievements.push(achievement);
          }
        }
      }
      
      return newlyUnlockedAchievements;
    } catch (error) {
      console.error("Error in checkAndUpdateAchievementProgress:", error);
      return [];
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
          strength: userId === 1 ? 100 : 10, // 100 for extortionist (user ID 1)
          stealth: userId === 1 ? 100 : 10,
          charisma: userId === 1 ? 100 : 10,
          intelligence: userId === 1 ? 100 : 10,
          strengthTrainingCooldown: null,
          stealthTrainingCooldown: null,
          charismaTrainingCooldown: null,
          intelligenceTrainingCooldown: null
        };
        
        const [newStats] = await db
          .insert(stats)
          .values(defaultStats)
          .returning();
        
        console.log(`[DEBUG] Created default stats for user ${userId}:`, newStats);
        return newStats;
      }
      
      // For user 1 (extortionist), always set stats to 100 even if they exist in the database
      if (userId === 1) {
        // Make sure extortionist always has 100 for all stats
        let updatedStats = {
          ...statResult,
          strength: 100,
          stealth: 100,
          charisma: 100,
          intelligence: 100
        };
        
        // Only update stats if they're not already 100
        if (statResult.strength !== 100 || statResult.stealth !== 100 || 
            statResult.charisma !== 100 || statResult.intelligence !== 100) {
          console.log("[DEBUG] Updating extortionist stats to 100");
          
          const [newStats] = await db
            .update(stats)
            .set({
              strength: 100,
              stealth: 100,
              charisma: 100,
              intelligence: 100
            })
            .where(eq(stats.userId, userId))
            .returning();
            
          updatedStats = newStats;
        }
        
        console.log(`[DEBUG] Returning extortionist stats:`, updatedStats);
        return updatedStats;
      }
      
      return statResult;
    } catch (error) {
      console.error("Error in getStatsByUserId:", error);
      return undefined;
    }
  }
  
  async updateStats(userId: number, statData: Partial<Stat>): Promise<Stat | undefined> {
    try {
      // For user ID 1 (extortionist), make sure all stats are 100
      let dataToUpdate = statData;
      if (userId === 1) {
        // Set all stats to 100 for extortionist
        dataToUpdate = {
          ...statData,
          strength: 100,
          stealth: 100,
          charisma: 100,
          intelligence: 100
        };
        console.log("[STATS] Forcing stats for extortionist to 100:", dataToUpdate);
      }

      const [result] = await db
        .update(stats)
        .set(dataToUpdate)
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
  // Get all jailed users
  async getJailedUsers(): Promise<User[]> {
    try {
      return await db
        .select()
        .from(users)
        .where(eq(users.isJailed, true));
    } catch (error) {
      console.error("Error in getJailedUsers:", error);
      return [];
    }
  }
  
  async getTopUsersByCash(limit: number = 10): Promise<User[]> {
    try {
      return await db
        .select()
        .from(users)
        .orderBy(desc(users.cash))
        .limit(limit);
    } catch (error) {
      console.error("Error in getTopUsersByCash:", error);
      return [];
    }
  }
  
  // Release a user from jail
  async releaseFromJail(userId: number): Promise<User | undefined> {
    try {
      console.log(`[DEBUG] Releasing user ${userId} from jail`);
      
      const [user] = await db
        .update(users)
        .set({
          isJailed: false,
          jailTimeEnd: null
        })
        .where(eq(users.id, userId))
        .returning();
      
      console.log(`[DEBUG] User release result:`, user);
      return user;
    } catch (error) {
      console.error("Error in releaseFromJail:", error);
      return undefined;
    }
  }
  
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

  // Social Methods - Friends
  async getUserFriends(userId: number): Promise<UserWithStatus[]> {
    return getUserFriends(userId);
  }

  async getFriendRequest(userId: number, friendId: number, requestId?: number): Promise<UserFriend | undefined> {
    return getFriendRequest(userId, friendId, requestId);
  }

  async sendFriendRequest(userId: number, friendId: number): Promise<UserFriend> {
    return sendFriendRequest(userId, friendId);
  }

  async updateFriendRequest(id: number, status: string): Promise<UserFriend | undefined> {
    return updateFriendRequest(id, status);
  }

  async removeFriend(userId: number, friendId: number): Promise<boolean> {
    return removeFriend(userId, friendId);
  }

  // Social Methods - Status
  async getUserStatus(userId: number): Promise<UserStatus | undefined> {
    return getUserStatus(userId);
  }

  async getUserWithStatus(userId: number, currentUserId: number): Promise<UserWithStatus | undefined> {
    return getUserWithStatus(userId, currentUserId);
  }

  async createUserStatus(status: InsertUserStatus): Promise<UserStatus> {
    return createUserStatus(status);
  }

  async updateUserStatus(userId: number, status: Partial<UserStatus>): Promise<UserStatus | undefined> {
    return updateUserStatus(userId, status);
  }

  async getOnlineUsers(limit: number = 50): Promise<UserWithStatus[]> {
    return getOnlineUsers(limit);
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();