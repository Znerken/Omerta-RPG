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
  challengeRewards
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
    
    // Initialize with default data when needed
    this.initializeDefaultData();
  }
  
  // Admin methods
  async getAllUsers(page: number = 1, limit: number = 20, search: string = ""): Promise<User[]> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(users);
    
    if (search) {
      query = query.where(
        sql`(${users.username} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'})`
      );
    }
    
    return await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.id));
  }
  
  async getUserCount(search: string = ""): Promise<number> {
    let query = db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    if (search) {
      query = query.where(
        sql`(${users.username} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'})`
      );
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }
  
  async getActiveUserCount(hoursAgo: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);
    
    // We would normally use lastActive, but it doesn't exist in the schema yet
    // For now, we'll get all users
    return await this.getUserCount();
  }
  
  private async initializeDefaultData() {
    // Check if there are any crimes, if not, create defaults
    const existingCrimes = await this.getAllCrimes();
    if (existingCrimes.length === 0) {
      await this.initializeDefaultCrimes();
    }
    
    // Check if there are any items, if not, create defaults
    const existingItems = await this.getAllItems();
    if (existingItems.length === 0) {
      await this.initializeDefaultItems();
    }
  }
  
  private async initializeDefaultCrimes() {
    const defaultCrimes = [
      {
        name: "Pickpocket",
        description: "Steal a wallet from an unsuspecting target",
        minCashReward: 50,
        maxCashReward: 100,
        minXpReward: 5,
        maxXpReward: 10,
        jailRisk: 10, // 10%
        jailTime: 300, // 5 minutes
        cooldown: 60, // 1 minute
        strengthWeight: 0.1,
        stealthWeight: 0.7,
        charismaWeight: 0.1,
        intelligenceWeight: 0.1
      },
      {
        name: "Shoplift",
        description: "Steal goods from a local store",
        minCashReward: 100,
        maxCashReward: 200,
        minXpReward: 10,
        maxXpReward: 20,
        jailRisk: 15, // 15%
        jailTime: 600, // 10 minutes
        cooldown: 120, // 2 minutes
        strengthWeight: 0.05,
        stealthWeight: 0.65,
        charismaWeight: 0.1,
        intelligenceWeight: 0.2
      },
      {
        name: "Car Theft",
        description: "Steal and sell a car",
        minCashReward: 300,
        maxCashReward: 700,
        minXpReward: 30,
        maxXpReward: 70,
        jailRisk: 25, // 25%
        jailTime: 900, // 15 minutes
        cooldown: 300, // 5 minutes
        strengthWeight: 0.2,
        stealthWeight: 0.4,
        charismaWeight: 0.05,
        intelligenceWeight: 0.35
      },
      {
        name: "Bank Heist",
        description: "Rob a small bank branch",
        minCashReward: 3000,
        maxCashReward: 7000,
        minXpReward: 300,
        maxXpReward: 700,
        jailRisk: 50, // 50%
        jailTime: 1800, // 30 minutes
        cooldown: 1800, // 30 minutes
        strengthWeight: 0.3,
        stealthWeight: 0.25,
        charismaWeight: 0.15,
        intelligenceWeight: 0.3
      }
    ];
    
    for (const crime of defaultCrimes) {
      await this.createCrime(crime);
    }
  }
  
  private async initializeDefaultItems() {
    const defaultItems = [
      {
        name: "Brass Knuckles",
        description: "Increases your strength in fights.",
        type: "weapon",
        price: 500,
        strengthBonus: 5,
        stealthBonus: 0,
        charismaBonus: 0,
        intelligenceBonus: 0,
        crimeSuccessBonus: 2,
        jailTimeReduction: 0,
        escapeChanceBonus: 0
      },
      {
        name: "Lockpick Set",
        description: "Professional tools to improve your stealth crimes.",
        type: "tool",
        price: 750,
        strengthBonus: 0,
        stealthBonus: 8,
        charismaBonus: 0,
        intelligenceBonus: 0,
        crimeSuccessBonus: 5,
        jailTimeReduction: 0,
        escapeChanceBonus: 0
      },
      {
        name: "Fake ID",
        description: "A convincing fake identity that helps in charisma-based situations.",
        type: "tool",
        price: 1000,
        strengthBonus: 0,
        stealthBonus: 0,
        charismaBonus: 6,
        intelligenceBonus: 0,
        crimeSuccessBonus: 3,
        jailTimeReduction: 0,
        escapeChanceBonus: 0
      },
      {
        name: "Bulletproof Vest",
        description: "Protection during dangerous crimes.",
        type: "protection",
        price: 2000,
        strengthBonus: 0,
        stealthBonus: -5, // Less stealthy when wearing
        charismaBonus: 0,
        intelligenceBonus: 0,
        crimeSuccessBonus: 8,
        jailTimeReduction: 0,
        escapeChanceBonus: 0
      },
      {
        name: "Hacking Device",
        description: "Helps with intelligence-based crimes involving technology.",
        type: "tool",
        price: 1500,
        strengthBonus: 0,
        stealthBonus: 0,
        charismaBonus: 0,
        intelligenceBonus: 10,
        crimeSuccessBonus: 5,
        jailTimeReduction: 0,
        escapeChanceBonus: 0
      }
    ];
    
    for (const item of defaultItems) {
      await this.createItem(item);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        level: 1,
        cash: 1000,
        respect: 0,
        xp: 0,
        isAdmin: false,
        isJailed: false,
      })
      .returning();
    
    // Create initial stats for the user
    await this.createStats({
      userId: user.id,
      strength: 10,
      stealth: 10,
      charisma: 10,
      intelligence: 10,
      strengthTrainingCooldown: null,
      stealthTrainingCooldown: null,
      charismaTrainingCooldown: null,
      intelligenceTrainingCooldown: null
    });
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async getUserWithStats(id: number): Promise<UserWithStats | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const userStats = await this.getStatsByUserId(id);
    if (!userStats) return undefined;
    
    return { ...user, stats: userStats };
  }
  
  async getUserWithGang(id: number): Promise<UserWithGang | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const gangMember = await this.getGangMember(id);
    
    if (!gangMember) {
      return { ...user };
    }
    
    return { 
      ...user,
      gang: gangMember.gang,
      gangRank: gangMember.rank
    };
  }
  
  // Stats methods
  async getStatsByUserId(userId: number): Promise<Stat | undefined> {
    const [userStats] = await db
      .select()
      .from(stats)
      .where(eq(stats.userId, userId));
    return userStats;
  }
  
  async createStats(insertStat: InsertStat): Promise<Stat> {
    const [stat] = await db
      .insert(stats)
      .values({
        ...insertStat,
        strength: 10,
        stealth: 10,
        charisma: 10,
        intelligence: 10
      })
      .returning();
    return stat;
  }
  
  async updateStats(userId: number, statData: Partial<Stat>): Promise<Stat | undefined> {
    const [stat] = await db
      .update(stats)
      .set(statData)
      .where(eq(stats.userId, userId))
      .returning();
    return stat;
  }
  
  // Crime methods
  async getAllCrimes(): Promise<Crime[]> {
    return await db.select().from(crimes);
  }
  
  async getCrime(id: number): Promise<Crime | undefined> {
    const [crime] = await db
      .select()
      .from(crimes)
      .where(eq(crimes.id, id));
    return crime;
  }
  
  async createCrime(insertCrime: InsertCrime): Promise<Crime> {
    const [crime] = await db
      .insert(crimes)
      .values(insertCrime)
      .returning();
    return crime;
  }
  
  async getCrimesWithHistory(userId: number): Promise<CrimeWithHistory[]> {
    const allCrimes = await this.getAllCrimes();
    const userStats = await this.getStatsByUserId(userId);
    const user = await this.getUser(userId);
    
    if (!user || !userStats) {
      return [];
    }
    
    // Get user's crime history
    const userCrimeHistory = await this.getCrimeHistoryByUserId(userId);
    
    // Map crimes with history and calculated success chance
    return allCrimes.map(crime => {
        // Find the most recent history for this crime
        const lastPerformed = userCrimeHistory.find(
          history => history.crimeId === crime.id
        );
        
        // Calculate success chance based on user stats and crime weights
        const strengthFactor = (userStats.strength / 100) * crime.strengthWeight;
        const stealthFactor = (userStats.stealth / 100) * crime.stealthWeight;
        const charismaFactor = (userStats.charisma / 100) * crime.charismaWeight;
        const intelligenceFactor = (userStats.intelligence / 100) * crime.intelligenceWeight;
        
        const successChance = Math.min(
          95, // Cap at 95%
          Math.round((strengthFactor + stealthFactor + charismaFactor + intelligenceFactor) * 100)
        );
        
        return {
          ...crime,
          lastPerformed,
          successChance
        };
      });
  }
  
  // Crime History methods
  async getCrimeHistoryByUserId(userId: number, limit: number = 10): Promise<CrimeHistory[]> {
    const query = db
      .select()
      .from(crimeHistory)
      .where(eq(crimeHistory.userId, userId))
      .orderBy(desc(crimeHistory.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }
  
  async createCrimeHistory(insertHistory: InsertCrimeHistory): Promise<CrimeHistory> {
    const [history] = await db
      .insert(crimeHistory)
      .values({
        ...insertHistory
      })
      .returning();
    return history;
  }
  
  // Item methods
  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items);
  }
  
  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db
      .select()
      .from(items)
      .where(eq(items.id, id));
    return item;
  }
  
  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values(insertItem)
      .returning();
    return item;
  }
  
  // User Inventory methods
  async getUserInventory(userId: number): Promise<ItemWithDetails[]> {
    // Join user_inventory with items to get item details
    const inventoryItems = await db
      .select({
        id: items.id,
        name: items.name,
        description: items.description,
        price: items.price,
        category: items.category,
        stats: items.stats,
        equipped: userInventory.equipped,
        quantity: userInventory.quantity,
      })
      .from(userInventory)
      .innerJoin(items, eq(userInventory.itemId, items.id))
      .where(eq(userInventory.userId, userId));
    
    return inventoryItems;
  }
  
  async addItemToInventory(insertInventory: InsertUserInventory): Promise<UserInventory> {
    // Check if user already has this item
    const [existingItem] = await db
      .select()
      .from(userInventory)
      .where(and(
        eq(userInventory.userId, insertInventory.userId),
        eq(userInventory.itemId, insertInventory.itemId)
      ));
    
    if (existingItem) {
      // Update quantity of existing item
      const [updatedInventory] = await db
        .update(userInventory)
        .set({ 
          quantity: existingItem.quantity + (insertInventory.quantity || 1)
        })
        .where(eq(userInventory.id, existingItem.id))
        .returning();
      return updatedInventory;
    }
    
    // Create new inventory entry
    const [inventory] = await db
      .insert(userInventory)
      .values({
        ...insertInventory,
        equipped: false,
        quantity: insertInventory.quantity || 1,
        acquiredAt: new Date()
      })
      .returning();
    
    return inventory;
  }
  
  async updateInventoryItem(id: number, itemData: Partial<UserInventory>): Promise<UserInventory | undefined> {
    const [updatedItem] = await db
      .update(userInventory)
      .set(itemData)
      .where(eq(userInventory.id, id))
      .returning();
    return updatedItem;
  }
  
  async removeItemFromInventory(userId: number, itemId: number): Promise<boolean> {
    const result = await db
      .delete(userInventory)
      .where(and(
        eq(userInventory.userId, userId),
        eq(userInventory.itemId, itemId)
      ));
    
    return result.rowCount > 0;
  }
  
  // Gang methods
  async getAllGangs(): Promise<Gang[]> {
    return await db.select().from(gangs);
  }
  
  async getGang(id: number): Promise<Gang | undefined> {
    const [gang] = await db
      .select()
      .from(gangs)
      .where(eq(gangs.id, id));
    return gang;
  }
  
  async getGangByName(name: string): Promise<Gang | undefined> {
    const [gang] = await db
      .select()
      .from(gangs)
      .where(sql`LOWER(${gangs.name}) = LOWER(${name})`);
    return gang;
  }
  
  async getGangByTag(tag: string): Promise<Gang | undefined> {
    const [gang] = await db
      .select()
      .from(gangs)
      .where(sql`LOWER(${gangs.tag}) = LOWER(${tag})`);
    return gang;
  }
  
  async createGang(insertGang: InsertGang): Promise<Gang> {
    const now = new Date();
    const [gang] = await db
      .insert(gangs)
      .values({
        ...insertGang,
        respect: 0,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return gang;
  }
  
  async updateGang(id: number, gangData: Partial<Gang>): Promise<Gang | undefined> {
    const [gang] = await db
      .update(gangs)
      .set({ ...gangData, updatedAt: new Date() })
      .where(eq(gangs.id, id))
      .returning();
    return gang;
  }
  
  async getGangWithMembers(id: number): Promise<GangWithMembers | undefined> {
    const gang = await this.getGang(id);
    if (!gang) return undefined;
    
    // Get all members of the gang with their user details
    const members = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        level: users.level,
        cash: users.cash,
        respect: users.respect,
        xp: users.xp,
        nextLevelXp: users.nextLevelXp,
        avatar: users.avatar,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastActive: users.lastActive,
        jailUntil: users.jailUntil,
        rank: gangMembers.rank,
      })
      .from(gangMembers)
      .innerJoin(users, eq(gangMembers.userId, users.id))
      .where(eq(gangMembers.gangId, id));
    
    return {
      ...gang,
      members
    };
  }
  
  // Gang Member methods
  async getGangMember(userId: number): Promise<(GangMember & { gang: Gang }) | undefined> {
    const [gangMember] = await db
      .select()
      .from(gangMembers)
      .where(eq(gangMembers.userId, userId));
    
    if (!gangMember) return undefined;
    
    const gang = await this.getGang(gangMember.gangId);
    if (!gang) return undefined;
    
    return { ...gangMember, gang };
  }
  
  async addGangMember(insertMember: InsertGangMember): Promise<GangMember> {
    const [member] = await db
      .insert(gangMembers)
      .values({
        ...insertMember,
        joinedAt: new Date()
      })
      .returning();
    return member;
  }
  
  async updateGangMember(userId: number, gangId: number, data: Partial<GangMember>): Promise<GangMember | undefined> {
    const [member] = await db
      .update(gangMembers)
      .set(data)
      .where(and(
        eq(gangMembers.userId, userId),
        eq(gangMembers.gangId, gangId)
      ))
      .returning();
    return member;
  }
  
  async removeGangMember(userId: number, gangId: number): Promise<boolean> {
    const result = await db
      .delete(gangMembers)
      .where(and(
        eq(gangMembers.userId, userId),
        eq(gangMembers.gangId, gangId)
      ));
    
    return result.rowCount > 0;
  }
  
  // Message methods
  async getUserMessages(userId: number, limit: number = 20): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        sql`(${messages.toUserId} = ${userId} OR ${messages.fromUserId} = ${userId})`,
        eq(messages.type, "personal")
      ))
      .orderBy(desc(messages.sentAt))
      .limit(limit);
  }
  
  async getGangMessages(gangId: number, limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.gangId, gangId),
        eq(messages.type, "gang")
      ))
      .orderBy(desc(messages.sentAt))
      .limit(limit);
  }
  
  async getJailMessages(limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.type, "jail"))
      .orderBy(desc(messages.sentAt))
      .limit(limit);
  }
  
  async getGlobalMessages(limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.type, "global"))
      .orderBy(desc(messages.sentAt))
      .limit(limit);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        read: false,
        sentAt: new Date()
      })
      .returning();
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }
  
  // Leaderboard methods
  async getTopUsersByLevel(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.level))
      .limit(limit);
  }
  
  async getTopUsersByCash(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.cash))
      .limit(limit);
  }
  
  async getTopUsersByRespect(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.respect))
      .limit(limit);
  }
  
  async getTopGangs(limit: number = 10): Promise<Gang[]> {
    return await db
      .select()
      .from(gangs)
      .orderBy(desc(gangs.respect))
      .limit(limit);
  }
  
  // Jail methods
  async getJailedUsers(): Promise<User[]> {
    const now = new Date();
    return await db
      .select()
      .from(users)
      .where(and(
        sql`${users.jailUntil} IS NOT NULL`,
        sql`${users.jailUntil} > ${now}`
      ))
      .orderBy(desc(users.jailUntil));
  }
  
  async releaseFromJail(userId: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        jailUntil: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // Challenge methods
  async getAllChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges);
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    const now = new Date();
    return await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.active, true),
          lte(challenges.startDate, now),
          gte(challenges.endDate, now)
        )
      );
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db
      .insert(challenges)
      .values(insertChallenge)
      .returning();
    return challenge;
  }

  async updateChallenge(id: number, challengeData: Partial<Challenge>): Promise<Challenge | undefined> {
    const [challenge] = await db
      .update(challenges)
      .set(challengeData)
      .where(eq(challenges.id, id))
      .returning();
    return challenge;
  }

  async deleteChallenge(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(challenges)
        .where(eq(challenges.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting challenge:", error);
      return false;
    }
  }

  async getChallengesWithProgress(userId: number): Promise<ChallengeWithProgress[]> {
    // Get active challenges
    const activeChallenges = await this.getActiveChallenges();
    
    // Get user's progress for these challenges
    const userProgress = await db
      .select()
      .from(challengeProgress)
      .where(eq(challengeProgress.userId, userId));
    
    // Map challenges with their progress
    return activeChallenges.map(challenge => {
      const progress = userProgress.find(p => p.challengeId === challenge.id);
      
      return {
        ...challenge,
        progress,
        completed: progress?.completed || false,
        claimed: progress?.claimed || false,
        currentValue: progress?.currentValue || 0
      };
    });
  }

  async getChallengeProgress(userId: number, challengeId: number): Promise<ChallengeProgress | undefined> {
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
  }

  async createChallengeProgress(insertProgress: InsertChallengeProgress): Promise<ChallengeProgress> {
    const [progress] = await db
      .insert(challengeProgress)
      .values({
        ...insertProgress,
        createdAt: new Date(),
        completedAt: null,
      })
      .returning();
    return progress;
  }

  async updateChallengeProgress(userId: number, challengeId: number, data: Partial<ChallengeProgress>): Promise<ChallengeProgress | undefined> {
    let updateData = { ...data };
    
    // If marking as completed and it wasn't before, set completedAt
    if (data.completed) {
      const currentProgress = await this.getChallengeProgress(userId, challengeId);
      if (currentProgress && !currentProgress.completed) {
        updateData.completedAt = new Date();
      }
    }
    
    const [progress] = await db
      .update(challengeProgress)
      .set(updateData)
      .where(
        and(
          eq(challengeProgress.userId, userId),
          eq(challengeProgress.challengeId, challengeId)
        )
      )
      .returning();
    return progress;
  }

  async createChallengeReward(insertReward: InsertChallengeReward): Promise<ChallengeReward> {
    const [reward] = await db
      .insert(challengeRewards)
      .values({
        ...insertReward,
        awardedAt: new Date(),
      })
      .returning();
    return reward;
  }

  async getUserChallengeRewards(userId: number, limit: number = 10): Promise<ChallengeReward[]> {
    return await db
      .select()
      .from(challengeRewards)
      .where(eq(challengeRewards.userId, userId))
      .orderBy(desc(challengeRewards.awardedAt))
      .limit(limit);
  }
}