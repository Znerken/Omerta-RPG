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
  messages
} from "@shared/schema";
import { eq, and, desc, gte, sql, asc } from "drizzle-orm";
import { db, pool } from "./db";
import { IStorage } from "./storage";
import { calculateCrimeSuccessChance } from "@shared/gameUtils";

const PostgresSessionStore = connectPg(session);

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true
    });
    
    // Initialize with default data when needed
    this.initializeDefaultData();
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
      .set({ ...userData, updatedAt: new Date() })
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
    const now = new Date();
    const [stat] = await db
      .insert(stats)
      .values({
        ...insertStat,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return stat;
  }
  
  async updateStats(userId: number, statData: Partial<Stat>): Promise<Stat | undefined> {
    const [stat] = await db
      .update(stats)
      .set({ ...statData, updatedAt: new Date() })
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
    return allCrimes
      .filter(crime => crime.requiredLevel <= user.level)
      .map(crime => {
        // Find the most recent history for this crime
        const lastPerformed = userCrimeHistory.find(
          history => history.crimeId === crime.id
        );
        
        // Parse the stat weights
        const statWeights = JSON.parse(crime.statWeights);
        
        // Calculate difficulty modifier
        const difficultyModifier = crime.difficulty === "easy" ? 0 
          : crime.difficulty === "medium" ? 10 
          : 20;
        
        // Calculate success chance based on user stats
        const successChance = calculateCrimeSuccessChance(
          {
            strength: userStats.strength,
            stealth: userStats.stealth,
            charisma: userStats.charisma,
            intelligence: userStats.intelligence
          },
          statWeights,
          difficultyModifier
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
      .orderBy(desc(crimeHistory.performedAt));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }
  
  async createCrimeHistory(insertHistory: InsertCrimeHistory): Promise<CrimeHistory> {
    const [history] = await db
      .insert(crimeHistory)
      .values({
        ...insertHistory,
        performedAt: new Date()
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
}