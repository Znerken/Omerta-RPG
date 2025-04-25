import {
  User,
  Stat,
  Crime,
  CrimeHistory,
  Item,
  UserInventory,
  Gang,
  GangMember,
  Message,
  InsertUser,
  InsertStat,
  InsertCrime,
  InsertCrimeHistory,
  InsertItem,
  InsertUserInventory,
  InsertGang,
  InsertGangMember,
  InsertMessage,
  UserWithStats,
  UserWithGang,
  CrimeWithHistory,
  ItemWithDetails,
  GangWithMembers
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Import database-specific classes
import { DatabaseStorage } from "./storage-database";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUserWithStats(id: number): Promise<UserWithStats | undefined>;
  getUserWithGang(id: number): Promise<UserWithGang | undefined>;
  
  // Stats methods
  getStatsByUserId(userId: number): Promise<Stat | undefined>;
  createStats(stats: InsertStat): Promise<Stat>;
  updateStats(userId: number, stats: Partial<Stat>): Promise<Stat | undefined>;
  
  // Crime methods
  getAllCrimes(): Promise<Crime[]>;
  getCrime(id: number): Promise<Crime | undefined>;
  createCrime(crime: InsertCrime): Promise<Crime>;
  getCrimesWithHistory(userId: number): Promise<CrimeWithHistory[]>;
  
  // Crime History methods
  getCrimeHistoryByUserId(userId: number, limit?: number): Promise<CrimeHistory[]>;
  createCrimeHistory(crimeHistory: InsertCrimeHistory): Promise<CrimeHistory>;
  
  // Item methods
  getAllItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  
  // User Inventory methods
  getUserInventory(userId: number): Promise<ItemWithDetails[]>;
  addItemToInventory(inventory: InsertUserInventory): Promise<UserInventory>;
  updateInventoryItem(id: number, item: Partial<UserInventory>): Promise<UserInventory | undefined>;
  removeItemFromInventory(userId: number, itemId: number): Promise<boolean>;
  
  // Gang methods
  getAllGangs(): Promise<Gang[]>;
  getGang(id: number): Promise<Gang | undefined>;
  getGangByName(name: string): Promise<Gang | undefined>;
  getGangByTag(tag: string): Promise<Gang | undefined>;
  createGang(gang: InsertGang): Promise<Gang>;
  updateGang(id: number, gang: Partial<Gang>): Promise<Gang | undefined>;
  getGangWithMembers(id: number): Promise<GangWithMembers | undefined>;
  
  // Gang Member methods
  getGangMember(userId: number): Promise<(GangMember & { gang: Gang }) | undefined>;
  addGangMember(member: InsertGangMember): Promise<GangMember>;
  updateGangMember(userId: number, gangId: number, data: Partial<GangMember>): Promise<GangMember | undefined>;
  removeGangMember(userId: number, gangId: number): Promise<boolean>;
  
  // Message methods
  getUserMessages(userId: number, limit?: number): Promise<Message[]>;
  getGangMessages(gangId: number, limit?: number): Promise<Message[]>;
  getJailMessages(limit?: number): Promise<Message[]>;
  getGlobalMessages(limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Leaderboard methods
  getTopUsersByLevel(limit?: number): Promise<User[]>;
  getTopUsersByCash(limit?: number): Promise<User[]>;
  getTopUsersByRespect(limit?: number): Promise<User[]>;
  getTopGangs(limit?: number): Promise<Gang[]>;
  
  // Jail methods
  getJailedUsers(): Promise<User[]>;
  releaseFromJail(userId: number): Promise<User | undefined>;
}

// Use the DatabaseStorage for all operations
// Instantiate and export the database storage implementation
export const storage = new DatabaseStorage();

// In-memory storage implementation - kept for reference
class MemStorage implements IStorage {
  // Storage
  private users: Map<number, User>;
  private stats: Map<number, Stat>;
  private crimes: Map<number, Crime>;
  private crimeHistory: Map<number, CrimeHistory>;
  private items: Map<number, Item>;
  private userInventory: Map<number, UserInventory>;
  private gangs: Map<number, Gang>;
  private gangMembers: Map<number, GangMember>;
  private messages: Map<number, Message>;
  
  // ID counters
  private userIdCounter: number;
  private statsIdCounter: number;
  private crimeIdCounter: number;
  private crimeHistoryIdCounter: number;
  private itemIdCounter: number;
  private userInventoryIdCounter: number;
  private gangIdCounter: number;
  private gangMemberIdCounter: number;
  private messageIdCounter: number;
  
  // Session store
  sessionStore: session.SessionStore;

  constructor() {
    // Initialize maps
    this.users = new Map();
    this.stats = new Map();
    this.crimes = new Map();
    this.crimeHistory = new Map();
    this.items = new Map();
    this.userInventory = new Map();
    this.gangs = new Map();
    this.gangMembers = new Map();
    this.messages = new Map();
    
    // Initialize counters
    this.userIdCounter = 1;
    this.statsIdCounter = 1;
    this.crimeIdCounter = 1;
    this.crimeHistoryIdCounter = 1;
    this.itemIdCounter = 1;
    this.userInventoryIdCounter = 1;
    this.gangIdCounter = 1;
    this.gangMemberIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize default crimes
    this.initializeDefaultCrimes();
    
    // Initialize default items
    this.initializeDefaultItems();
  }

  private initializeDefaultCrimes() {
    const defaultCrimes: InsertCrime[] = [
      {
        name: "Pickpocket a Tourist",
        description: "Easy crime with low risk. Steal cash from unsuspecting tourists.",
        minCashReward: 50,
        maxCashReward: 150,
        minXpReward: 5,
        maxXpReward: 10,
        jailRisk: 10, // 10%
        jailTime: 300, // 5 minutes
        cooldown: 60, // 1 minute
        strengthWeight: 0.1,
        stealthWeight: 0.6,
        charismaWeight: 0.2,
        intelligenceWeight: 0.1,
      },
      {
        name: "Break into a Car",
        description: "Medium difficulty crime. Steal valuable items from parked vehicles.",
        minCashReward: 200,
        maxCashReward: 500,
        minXpReward: 15,
        maxXpReward: 25,
        jailRisk: 25, // 25%
        jailTime: 600, // 10 minutes
        cooldown: 180, // 3 minutes
        strengthWeight: 0.2,
        stealthWeight: 0.4,
        charismaWeight: 0.1,
        intelligenceWeight: 0.3,
      },
      {
        name: "Rob a Convenience Store",
        description: "Difficult crime with high rewards but significant risk of getting caught.",
        minCashReward: 1000,
        maxCashReward: 2000,
        minXpReward: 40,
        maxXpReward: 60,
        jailRisk: 40, // 40%
        jailTime: 900, // 15 minutes
        cooldown: 600, // 10 minutes
        strengthWeight: 0.3,
        stealthWeight: 0.2,
        charismaWeight: 0.2,
        intelligenceWeight: 0.3,
      },
      {
        name: "Steal a Car",
        description: "Steal a car and sell it to a chop shop for quick cash.",
        minCashReward: 500,
        maxCashReward: 1500,
        minXpReward: 25,
        maxXpReward: 40,
        jailRisk: 30, // 30%
        jailTime: 1200, // 20 minutes
        cooldown: 300, // 5 minutes
        strengthWeight: 0.3,
        stealthWeight: 0.4,
        charismaWeight: 0.1,
        intelligenceWeight: 0.2,
      },
      {
        name: "Run a Blackmail Scheme",
        description: "Blackmail a wealthy person with compromising information.",
        minCashReward: 2000,
        maxCashReward: 5000,
        minXpReward: 50,
        maxXpReward: 100,
        jailRisk: 20, // 20%
        jailTime: 1800, // 30 minutes
        cooldown: 1800, // 30 minutes
        strengthWeight: 0.1,
        stealthWeight: 0.2,
        charismaWeight: 0.4,
        intelligenceWeight: 0.3,
      },
    ];
    
    defaultCrimes.forEach(crime => {
      this.createCrime(crime);
    });
  }

  private initializeDefaultItems() {
    const defaultItems: InsertItem[] = [
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
        escapeChanceBonus: 0,
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
        escapeChanceBonus: 0,
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
        escapeChanceBonus: 0,
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
        escapeChanceBonus: 0,
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
        escapeChanceBonus: 0,
      },
      {
        name: "Prison Shank",
        description: "Increases your chance of escaping from jail.",
        type: "weapon",
        price: 1000,
        strengthBonus: 3,
        stealthBonus: 0,
        charismaBonus: 0,
        intelligenceBonus: 0,
        crimeSuccessBonus: 0,
        jailTimeReduction: 0,
        escapeChanceBonus: 15,
      },
      {
        name: "Guard Bribe Kit",
        description: "Money and gifts to bribe guards, reducing jail time.",
        type: "consumable",
        price: 2500,
        strengthBonus: 0,
        stealthBonus: 0,
        charismaBonus: 0,
        intelligenceBonus: 0,
        crimeSuccessBonus: 0,
        jailTimeReduction: 50, // Reduces jail time by 50%
        escapeChanceBonus: 0,
      },
    ];
    
    defaultItems.forEach(item => {
      this.createItem(item);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      level: 1,
      xp: 0,
      cash: 1000,
      respect: 0,
      isAdmin: false,
      isJailed: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    
    // Create stats for the user
    await this.createStats({ userId: id });
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
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
    
    const gangMembership = await this.getGangMember(id);
    if (!gangMembership) return { ...user };
    
    return { 
      ...user, 
      gang: gangMembership.gang,
      gangRank: gangMembership.rank
    };
  }

  // Stats methods
  async getStatsByUserId(userId: number): Promise<Stat | undefined> {
    return Array.from(this.stats.values()).find(
      (stat) => stat.userId === userId,
    );
  }

  async createStats(insertStat: InsertStat): Promise<Stat> {
    const id = this.statsIdCounter++;
    const now = new Date();
    
    const stat: Stat = {
      id,
      userId: insertStat.userId,
      strength: 10,
      stealth: 10,
      charisma: 10,
      intelligence: 10,
      strengthTrainingCooldown: now,
      stealthTrainingCooldown: now,
      charismaTrainingCooldown: now,
      intelligenceTrainingCooldown: now,
    };
    
    this.stats.set(id, stat);
    return stat;
  }

  async updateStats(userId: number, statData: Partial<Stat>): Promise<Stat | undefined> {
    const userStat = await this.getStatsByUserId(userId);
    if (!userStat) return undefined;
    
    const updatedStat = { ...userStat, ...statData };
    this.stats.set(userStat.id, updatedStat);
    return updatedStat;
  }

  // Crime methods
  async getAllCrimes(): Promise<Crime[]> {
    return Array.from(this.crimes.values());
  }

  async getCrime(id: number): Promise<Crime | undefined> {
    return this.crimes.get(id);
  }

  async createCrime(insertCrime: InsertCrime): Promise<Crime> {
    const id = this.crimeIdCounter++;
    const crime: Crime = { ...insertCrime, id };
    this.crimes.set(id, crime);
    return crime;
  }

  async getCrimesWithHistory(userId: number): Promise<CrimeWithHistory[]> {
    const crimes = await this.getAllCrimes();
    const userStats = await this.getStatsByUserId(userId);
    const userHistory = await this.getCrimeHistoryByUserId(userId);
    
    if (!userStats) {
      return [];
    }
    
    return crimes.map(crime => {
      const lastPerformed = userHistory.find(h => h.crimeId === crime.id);
      
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
    const userHistory = Array.from(this.crimeHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? userHistory.slice(0, limit) : userHistory;
  }

  async createCrimeHistory(insertHistory: InsertCrimeHistory): Promise<CrimeHistory> {
    const id = this.crimeHistoryIdCounter++;
    const history: CrimeHistory = { 
      ...insertHistory, 
      id,
      timestamp: new Date()
    };
    this.crimeHistory.set(id, history);
    return history;
  }

  // Item methods
  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.itemIdCounter++;
    const item: Item = { ...insertItem, id };
    this.items.set(id, item);
    return item;
  }

  // User Inventory methods
  async getUserInventory(userId: number): Promise<ItemWithDetails[]> {
    const inventory = Array.from(this.userInventory.values())
      .filter(inv => inv.userId === userId);
    
    const items = await this.getAllItems();
    
    return inventory.map(inv => {
      const item = items.find(i => i.id === inv.itemId);
      if (!item) throw new Error(`Item with id ${inv.itemId} not found`);
      
      return {
        ...item,
        equipped: inv.equipped,
        quantity: inv.quantity
      };
    });
  }

  async addItemToInventory(insertInventory: InsertUserInventory): Promise<UserInventory> {
    // Check if user already has this item
    const existingItem = Array.from(this.userInventory.values()).find(
      inv => inv.userId === insertInventory.userId && inv.itemId === insertInventory.itemId
    );
    
    if (existingItem) {
      // Update quantity
      const updatedItem = { 
        ...existingItem, 
        quantity: existingItem.quantity + (insertInventory.quantity || 1) 
      };
      this.userInventory.set(existingItem.id, updatedItem);
      return updatedItem;
    }
    
    // Add new item
    const id = this.userInventoryIdCounter++;
    const inventory: UserInventory = { 
      ...insertInventory, 
      id,
      equipped: false,
    };
    this.userInventory.set(id, inventory);
    return inventory;
  }

  async updateInventoryItem(id: number, itemData: Partial<UserInventory>): Promise<UserInventory | undefined> {
    const inventoryItem = this.userInventory.get(id);
    if (!inventoryItem) return undefined;
    
    const updatedItem = { ...inventoryItem, ...itemData };
    this.userInventory.set(id, updatedItem);
    return updatedItem;
  }

  async removeItemFromInventory(userId: number, itemId: number): Promise<boolean> {
    const inventoryItem = Array.from(this.userInventory.values()).find(
      inv => inv.userId === userId && inv.itemId === itemId
    );
    
    if (!inventoryItem) return false;
    
    if (inventoryItem.quantity > 1) {
      // Decrease quantity
      inventoryItem.quantity -= 1;
      this.userInventory.set(inventoryItem.id, inventoryItem);
    } else {
      // Remove item
      this.userInventory.delete(inventoryItem.id);
    }
    
    return true;
  }

  // Gang methods
  async getAllGangs(): Promise<Gang[]> {
    return Array.from(this.gangs.values());
  }

  async getGang(id: number): Promise<Gang | undefined> {
    return this.gangs.get(id);
  }

  async getGangByName(name: string): Promise<Gang | undefined> {
    return Array.from(this.gangs.values()).find(
      (gang) => gang.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async getGangByTag(tag: string): Promise<Gang | undefined> {
    return Array.from(this.gangs.values()).find(
      (gang) => gang.tag.toLowerCase() === tag.toLowerCase(),
    );
  }

  async createGang(insertGang: InsertGang): Promise<Gang> {
    const id = this.gangIdCounter++;
    const gang: Gang = { 
      ...insertGang, 
      id,
      bankBalance: 0,
      createdAt: new Date(),
    };
    this.gangs.set(id, gang);
    
    // Add owner as a member with Leader rank
    await this.addGangMember({
      gangId: id,
      userId: insertGang.ownerId,
      rank: "Leader"
    });
    
    return gang;
  }

  async updateGang(id: number, gangData: Partial<Gang>): Promise<Gang | undefined> {
    const gang = await this.getGang(id);
    if (!gang) return undefined;
    
    const updatedGang = { ...gang, ...gangData };
    this.gangs.set(id, updatedGang);
    return updatedGang;
  }

  async getGangWithMembers(id: number): Promise<GangWithMembers | undefined> {
    const gang = await this.getGang(id);
    if (!gang) return undefined;
    
    const allMembers = Array.from(this.gangMembers.values())
      .filter(member => member.gangId === id);
    
    const members = await Promise.all(allMembers.map(async member => {
      const user = await this.getUser(member.userId);
      if (!user) throw new Error(`User with id ${member.userId} not found`);
      
      return {
        ...user,
        rank: member.rank
      };
    }));
    
    return {
      ...gang,
      members
    };
  }

  // Gang Member methods
  async getGangMember(userId: number): Promise<(GangMember & { gang: Gang }) | undefined> {
    const member = Array.from(this.gangMembers.values()).find(
      m => m.userId === userId
    );
    
    if (!member) return undefined;
    
    const gang = await this.getGang(member.gangId);
    if (!gang) throw new Error(`Gang with id ${member.gangId} not found`);
    
    return {
      ...member,
      gang
    };
  }

  async addGangMember(insertMember: InsertGangMember): Promise<GangMember> {
    const id = this.gangMemberIdCounter++;
    const member: GangMember = { 
      ...insertMember, 
      id,
      joinedAt: new Date(),
    };
    this.gangMembers.set(id, member);
    return member;
  }

  async updateGangMember(userId: number, gangId: number, data: Partial<GangMember>): Promise<GangMember | undefined> {
    const member = Array.from(this.gangMembers.values()).find(
      m => m.userId === userId && m.gangId === gangId
    );
    
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...data };
    this.gangMembers.set(member.id, updatedMember);
    return updatedMember;
  }

  async removeGangMember(userId: number, gangId: number): Promise<boolean> {
    const member = Array.from(this.gangMembers.values()).find(
      m => m.userId === userId && m.gangId === gangId
    );
    
    if (!member) return false;
    
    this.gangMembers.delete(member.id);
    return true;
  }

  // Message methods
  async getUserMessages(userId: number, limit: number = 20): Promise<Message[]> {
    const userMessages = Array.from(this.messages.values())
      .filter(msg => 
        (msg.type === "personal" && msg.receiverId === userId) || 
        msg.senderId === userId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? userMessages.slice(0, limit) : userMessages;
  }

  async getGangMessages(gangId: number, limit: number = 50): Promise<Message[]> {
    const gangMessages = Array.from(this.messages.values())
      .filter(msg => msg.type === "gang" && msg.gangId === gangId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? gangMessages.slice(0, limit) : gangMessages;
  }

  async getJailMessages(limit: number = 50): Promise<Message[]> {
    const jailMessages = Array.from(this.messages.values())
      .filter(msg => msg.type === "jail")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? jailMessages.slice(0, limit) : jailMessages;
  }

  async getGlobalMessages(limit: number = 50): Promise<Message[]> {
    const globalMessages = Array.from(this.messages.values())
      .filter(msg => msg.type === "global")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? globalMessages.slice(0, limit) : globalMessages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = { 
      ...insertMessage, 
      id,
      read: false,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Leaderboard methods
  async getTopUsersByLevel(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      })
      .slice(0, limit);
  }

  async getTopUsersByCash(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.cash - a.cash)
      .slice(0, limit);
  }

  async getTopUsersByRespect(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.respect - a.respect)
      .slice(0, limit);
  }

  async getTopGangs(limit: number = 10): Promise<Gang[]> {
    return Array.from(this.gangs.values())
      .sort((a, b) => b.bankBalance - a.bankBalance)
      .slice(0, limit);
  }

  // Jail methods
  async getJailedUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.isJailed);
  }

  async releaseFromJail(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      isJailed: false,
      jailTimeEnd: undefined
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
}

// This is now handled by the DatabaseStorage implementation at the top of the file
// const memStorage = new MemStorage();
