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
  GangWithMembers,
  GangWithDetails,
  // Gang Territory, War, and Mission types
  GangTerritory,
  GangWar,
  GangWarParticipant,
  GangMission,
  GangMissionAttempt,
  InsertGangTerritory,
  InsertGangWar,
  InsertGangWarParticipant,
  InsertGangMission,
  InsertGangMissionAttempt,
  GangTerritoryWithDetails,
  GangWarWithDetails,
  GangMissionWithDetails,
  // Challenge types
  Challenge,
  ChallengeProgress,
  ChallengeReward,
  InsertChallenge,
  InsertChallengeProgress,
  InsertChallengeReward,
  ChallengeWithProgress,
  // Achievement types
  Achievement,
  UserAchievement,
  InsertUserAchievement,
  AchievementWithUnlocked
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Import database-specific classes
import { DatabaseStorage } from "./storage-database";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
export interface IStorage {
  // Session store
  sessionStore: any;

  // Admin methods
  getAllUsers(page?: number, limit?: number, search?: string): Promise<User[]>;
  getUserCount(search?: string): Promise<number>;
  getActiveUserCount(hoursAgo?: number): Promise<number>;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUserWithStats(id: number): Promise<UserWithStats | undefined>;
  getUserWithGang(id: number): Promise<UserWithGang | undefined>;
  
  // User Profile methods
  getUserProfile(userId: number): Promise<User | undefined>;
  getAchievementsWithUnlocked(userId: number): Promise<AchievementWithUnlocked[]>;
  markAchievementAsViewed(userId: number, achievementId: number): Promise<boolean>;
  getUnviewedAchievements(userId: number): Promise<AchievementWithUnlocked[]>;
  
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
  getGangWithDetails(id: number): Promise<GangWithDetails | undefined>;
  
  // Gang Member methods
  getGangMember(userId: number): Promise<(GangMember & { gang: Gang }) | undefined>;
  addGangMember(member: InsertGangMember): Promise<GangMember>;
  updateGangMember(userId: number, gangId: number, data: Partial<GangMember>): Promise<GangMember | undefined>;
  removeGangMember(userId: number, gangId: number): Promise<boolean>;
  getGangMemberCount(gangId: number): Promise<number>;
  updateMemberContribution(userId: number, gangId: number, amount: number): Promise<GangMember | undefined>;
  
  // Gang Territory methods
  getAllTerritories(): Promise<GangTerritory[]>;
  getTerritory(id: number): Promise<GangTerritory | undefined>;
  getTerritoryWithDetails(id: number): Promise<GangTerritoryWithDetails | undefined>;
  getTerritoriesByGangId(gangId: number): Promise<GangTerritory[]>;
  createTerritory(territory: InsertGangTerritory): Promise<GangTerritory>;
  updateTerritory(id: number, data: Partial<GangTerritory>): Promise<GangTerritory | undefined>;
  claimTerritory(territoryId: number, gangId: number): Promise<GangTerritory | undefined>;
  
  // Gang War methods
  getActiveWars(): Promise<GangWar[]>;
  getWarsByGangId(gangId: number, status?: string): Promise<GangWar[]>;
  getWar(id: number): Promise<GangWar | undefined>;
  getWarWithDetails(id: number): Promise<GangWarWithDetails | undefined>;
  startWar(war: InsertGangWar): Promise<GangWar>;
  updateWar(id: number, data: Partial<GangWar>): Promise<GangWar | undefined>;
  endWar(id: number, winnerId: number): Promise<GangWar | undefined>;
  addWarParticipant(participant: InsertGangWarParticipant): Promise<GangWarParticipant>;
  updateWarParticipantContribution(userId: number, warId: number, amount: number): Promise<GangWarParticipant | undefined>;
  
  // Gang Mission methods
  getAllMissions(): Promise<GangMission[]>;
  getAvailableMissions(gangId: number): Promise<GangMissionWithDetails[]>;
  getMission(id: number): Promise<GangMission | undefined>;
  getMissionWithDetails(id: number, gangId: number): Promise<GangMissionWithDetails | undefined>;
  createMission(mission: InsertGangMission): Promise<GangMission>;
  updateMission(id: number, data: Partial<GangMission>): Promise<GangMission | undefined>;
  startMissionAttempt(attempt: InsertGangMissionAttempt): Promise<GangMissionAttempt>;
  updateMissionAttempt(gangId: number, missionId: number, data: Partial<GangMissionAttempt>): Promise<GangMissionAttempt | undefined>;
  completeMissionAttempt(gangId: number, missionId: number, success: boolean): Promise<GangMissionAttempt | undefined>;
  
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
  
  // Challenge methods
  getAllChallenges(): Promise<Challenge[]>;
  getActiveChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, challengeData: Partial<Challenge>): Promise<Challenge | undefined>;
  deleteChallenge(id: number): Promise<boolean>;
  getChallengesWithProgress(userId: number): Promise<ChallengeWithProgress[]>;
  getChallengeProgress(userId: number, challengeId: number): Promise<ChallengeProgress | undefined>;
  createChallengeProgress(progress: InsertChallengeProgress): Promise<ChallengeProgress>;
  updateChallengeProgress(userId: number, challengeId: number, data: Partial<ChallengeProgress>): Promise<ChallengeProgress | undefined>;
  createChallengeReward(reward: InsertChallengeReward): Promise<ChallengeReward>;
  getUserChallengeRewards(userId: number, limit?: number): Promise<ChallengeReward[]>;
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
  private gangTerritories: Map<number, GangTerritory>;
  private gangWars: Map<number, GangWar>;
  private gangWarParticipants: Map<number, GangWarParticipant>;
  private gangMissions: Map<number, GangMission>;
  private gangMissionAttempts: Map<number, GangMissionAttempt>;
  private messages: Map<number, Message>;
  private challenges: Map<number, Challenge>;
  private challengeProgress: Map<number, ChallengeProgress>;
  private challengeRewards: Map<number, ChallengeReward>;
  
  // ID counters
  private userIdCounter: number;
  private statsIdCounter: number;
  private crimeIdCounter: number;
  private crimeHistoryIdCounter: number;
  private itemIdCounter: number;
  private userInventoryIdCounter: number;
  private gangIdCounter: number;
  private gangMemberIdCounter: number;
  private gangTerritoryIdCounter: number;
  private gangWarIdCounter: number;
  private gangWarParticipantIdCounter: number;
  private gangMissionIdCounter: number;
  private gangMissionAttemptIdCounter: number;
  private messageIdCounter: number;
  private challengeIdCounter: number;
  private challengeProgressIdCounter: number;
  private challengeRewardIdCounter: number;
  
  // Session store
  sessionStore: any;

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
    this.gangTerritories = new Map();
    this.gangWars = new Map();
    this.gangWarParticipants = new Map();
    this.gangMissions = new Map();
    this.gangMissionAttempts = new Map();
    this.messages = new Map();
    this.challenges = new Map();
    this.challengeProgress = new Map();
    this.challengeRewards = new Map();
    
    // Initialize counters
    this.userIdCounter = 1;
    this.statsIdCounter = 1;
    this.crimeIdCounter = 1;
    this.crimeHistoryIdCounter = 1;
    this.itemIdCounter = 1;
    this.userInventoryIdCounter = 1;
    this.gangIdCounter = 1;
    this.gangMemberIdCounter = 1;
    this.gangTerritoryIdCounter = 1;
    this.gangWarIdCounter = 1;
    this.gangWarParticipantIdCounter = 1;
    this.gangMissionIdCounter = 1;
    this.gangMissionAttemptIdCounter = 1;
    this.messageIdCounter = 1;
    this.challengeIdCounter = 1;
    this.challengeProgressIdCounter = 1;
    this.challengeRewardIdCounter = 1;
    
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
    
    // Add owner as a member with Boss rank
    await this.addGangMember({
      gangId: id,
      userId: insertGang.ownerId,
      rank: "Boss"
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
  
  async getGangWithDetails(id: number): Promise<GangWithDetails | undefined> {
    const gang = await this.getGang(id);
    if (!gang) return undefined;
    
    // Get members with contribution data
    const allMembers = Array.from(this.gangMembers.values())
      .filter(member => member.gangId === id);
    
    const members = await Promise.all(allMembers.map(async member => {
      const user = await this.getUser(member.userId);
      if (!user) throw new Error(`User with id ${member.userId} not found`);
      
      return {
        ...user,
        rank: member.rank,
        contribution: member.contribution || 0
      };
    }));
    
    // Get territories controlled by this gang
    const territories = Array.from(this.gangTerritories.values())
      .filter(territory => territory.controlledByGangId === id);
    
    // Get active wars involving this gang
    const activeWars = Array.from(this.gangWars.values())
      .filter(war => 
        (war.attackerGangId === id || war.defenderGangId === id) && 
        war.status === 'active'
      );
    
    // Get active missions with current attempts
    const activeMissions = await Promise.all(
      Array.from(this.gangMissions.values())
        .filter(mission => mission.isActive)
        .map(async mission => {
          const attempt = Array.from(this.gangMissionAttempts.values()).find(
            a => a.missionId === mission.id && a.gangId === id && !a.isCompleted
          );
          
          if (attempt) {
            return {
              ...mission,
              attempt
            };
          }
          
          return null;
        })
    );
    
    // Filter out null values (missions not currently attempted by this gang)
    const filteredMissions = activeMissions.filter(mission => mission !== null) as (GangMission & { attempt: GangMissionAttempt })[];
    
    return {
      ...gang,
      members,
      territories,
      activeWars,
      activeMissions: filteredMissions
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
  
  async getGangMemberCount(gangId: number): Promise<number> {
    return Array.from(this.gangMembers.values()).filter(
      member => member.gangId === gangId
    ).length;
  }
  
  async updateMemberContribution(userId: number, gangId: number, amount: number): Promise<GangMember | undefined> {
    const member = Array.from(this.gangMembers.values()).find(
      m => m.userId === userId && m.gangId === gangId
    );
    
    if (!member) return undefined;
    
    const updatedMember = { 
      ...member, 
      contribution: (member.contribution || 0) + amount 
    };
    
    this.gangMembers.set(member.id, updatedMember);
    return updatedMember;
  }
  
  // Gang Territory methods
  async getAllTerritories(): Promise<GangTerritory[]> {
    return Array.from(this.gangTerritories.values());
  }
  
  async getTerritory(id: number): Promise<GangTerritory | undefined> {
    return this.gangTerritories.get(id);
  }
  
  async getTerritoryWithDetails(id: number): Promise<GangTerritoryWithDetails | undefined> {
    const territory = await this.getTerritory(id);
    if (!territory) return undefined;
    
    const controller = territory.controlledByGangId ? 
      await this.getGang(territory.controlledByGangId) : 
      undefined;
    
    return {
      ...territory,
      controller
    };
  }
  
  async getTerritoriesByGangId(gangId: number): Promise<GangTerritory[]> {
    return Array.from(this.gangTerritories.values()).filter(
      territory => territory.controlledByGangId === gangId
    );
  }
  
  async createTerritory(territory: InsertGangTerritory): Promise<GangTerritory> {
    const id = this.gangTerritoryIdCounter++;
    const now = new Date();
    
    const newTerritory: GangTerritory = {
      ...territory,
      id,
      createdAt: now,
      lastCapturedAt: territory.controlledByGangId ? now : null
    };
    
    this.gangTerritories.set(id, newTerritory);
    return newTerritory;
  }
  
  async updateTerritory(id: number, data: Partial<GangTerritory>): Promise<GangTerritory | undefined> {
    const territory = await this.getTerritory(id);
    if (!territory) return undefined;
    
    const updatedTerritory = { ...territory, ...data };
    this.gangTerritories.set(id, updatedTerritory);
    return updatedTerritory;
  }
  
  async claimTerritory(territoryId: number, gangId: number): Promise<GangTerritory | undefined> {
    const territory = await this.getTerritory(territoryId);
    if (!territory) return undefined;
    
    const gang = await this.getGang(gangId);
    if (!gang) return undefined;
    
    const updatedTerritory: GangTerritory = {
      ...territory,
      controlledByGangId: gangId,
      lastCapturedAt: new Date()
    };
    
    this.gangTerritories.set(territoryId, updatedTerritory);
    return updatedTerritory;
  }
  
  // Gang War methods
  async getAllGangWars(): Promise<GangWar[]> {
    return Array.from(this.gangWars.values());
  }
  
  async getGangWar(id: number): Promise<GangWar | undefined> {
    return this.gangWars.get(id);
  }
  
  async getActiveGangWars(): Promise<GangWar[]> {
    return Array.from(this.gangWars.values()).filter(
      war => war.status === 'active'
    );
  }
  
  async getGangWarsForGang(gangId: number): Promise<GangWar[]> {
    return Array.from(this.gangWars.values()).filter(
      war => war.attackerGangId === gangId || war.defenderGangId === gangId
    );
  }
  
  async getGangWarWithDetails(id: number): Promise<GangWarWithDetails | undefined> {
    const war = await this.getGangWar(id);
    if (!war) return undefined;
    
    const attacker = await this.getGang(war.attackerGangId);
    if (!attacker) throw new Error(`Attacker gang with id ${war.attackerGangId} not found`);
    
    const defender = await this.getGang(war.defenderGangId);
    if (!defender) throw new Error(`Defender gang with id ${war.defenderGangId} not found`);
    
    let territory: GangTerritory | undefined;
    if (war.territoryId) {
      territory = await this.getTerritory(war.territoryId);
    }
    
    const participantEntries = Array.from(this.gangWarParticipants.values())
      .filter(p => p.warId === id);
    
    const participants = await Promise.all(
      participantEntries.map(async participant => {
        const user = await this.getUser(participant.userId);
        if (!user) throw new Error(`User with id ${participant.userId} not found`);
        
        return {
          ...participant,
          user
        };
      })
    );
    
    return {
      ...war,
      attacker,
      defender,
      territory,
      participants
    };
  }
  
  async createGangWar(war: InsertGangWar): Promise<GangWar> {
    const id = this.gangWarIdCounter++;
    const now = new Date();
    
    const newWar: GangWar = {
      ...war,
      id,
      startTime: now,
      status: 'active',
      attackerScore: 0,
      defenderScore: 0,
      endTime: null,
      winnerGangId: null
    };
    
    this.gangWars.set(id, newWar);
    return newWar;
  }
  
  async updateGangWar(id: number, data: Partial<GangWar>): Promise<GangWar | undefined> {
    const war = await this.getGangWar(id);
    if (!war) return undefined;
    
    const updatedWar = { ...war, ...data };
    this.gangWars.set(id, updatedWar);
    return updatedWar;
  }
  
  async endGangWar(id: number, winnerGangId: number): Promise<GangWar | undefined> {
    const war = await this.getGangWar(id);
    if (!war) return undefined;
    
    const updatedWar: GangWar = {
      ...war,
      status: 'completed',
      endTime: new Date(),
      winnerGangId
    };
    
    this.gangWars.set(id, updatedWar);
    
    // If there's a territory at stake, transfer it to the winner
    if (war.territoryId) {
      await this.claimTerritory(war.territoryId, winnerGangId);
    }
    
    return updatedWar;
  }
  
  async addGangWarParticipant(participant: InsertGangWarParticipant): Promise<GangWarParticipant> {
    const id = this.gangWarParticipantIdCounter++;
    const newParticipant: GangWarParticipant = {
      ...participant,
      id,
      joinedAt: new Date(),
      contribution: 0
    };
    
    this.gangWarParticipants.set(id, newParticipant);
    return newParticipant;
  }
  
  async updateGangWarParticipant(userId: number, warId: number, data: Partial<GangWarParticipant>): Promise<GangWarParticipant | undefined> {
    const participant = Array.from(this.gangWarParticipants.values()).find(
      p => p.userId === userId && p.warId === warId
    );
    
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, ...data };
    this.gangWarParticipants.set(participant.id, updatedParticipant);
    return updatedParticipant;
  }
  
  async getGangWarParticipants(warId: number): Promise<GangWarParticipant[]> {
    return Array.from(this.gangWarParticipants.values()).filter(
      p => p.warId === warId
    );
  }
  
  async getGangWarParticipant(userId: number, warId: number): Promise<GangWarParticipant | undefined> {
    return Array.from(this.gangWarParticipants.values()).find(
      p => p.userId === userId && p.warId === warId
    );
  }
  
  // Gang Mission methods
  async getAllGangMissions(): Promise<GangMission[]> {
    return Array.from(this.gangMissions.values());
  }
  
  async getActiveMissions(): Promise<GangMission[]> {
    return Array.from(this.gangMissions.values()).filter(
      mission => mission.isActive
    );
  }
  
  async getGangMission(id: number): Promise<GangMission | undefined> {
    return this.gangMissions.get(id);
  }
  
  async getGangMissionWithDetails(id: number, gangId: number): Promise<GangMissionWithDetails | undefined> {
    const mission = await this.getGangMission(id);
    if (!mission) return undefined;
    
    const currentAttempt = Array.from(this.gangMissionAttempts.values()).find(
      attempt => attempt.missionId === id && 
                attempt.gangId === gangId && 
                !attempt.isCompleted
    );
    
    // Check if the gang can attempt this mission
    // (based on cooldown or other criteria)
    const completedAttempt = Array.from(this.gangMissionAttempts.values()).find(
      attempt => attempt.missionId === id && 
                attempt.gangId === gangId && 
                attempt.isCompleted
    );
    
    const canAttempt = mission.isActive && 
      (!completedAttempt || 
        (completedAttempt.completedAt && 
         (new Date().getTime() - completedAttempt.completedAt.getTime() > mission.cooldownTime * 1000)));
    
    return {
      ...mission,
      currentAttempt,
      canAttempt
    };
  }
  
  async createGangMission(mission: InsertGangMission): Promise<GangMission> {
    const id = this.gangMissionIdCounter++;
    const newMission: GangMission = {
      ...mission,
      id,
      createdAt: new Date()
    };
    
    this.gangMissions.set(id, newMission);
    return newMission;
  }
  
  async updateGangMission(id: number, data: Partial<GangMission>): Promise<GangMission | undefined> {
    const mission = await this.getGangMission(id);
    if (!mission) return undefined;
    
    const updatedMission = { ...mission, ...data };
    this.gangMissions.set(id, updatedMission);
    return updatedMission;
  }
  
  async startGangMissionAttempt(attempt: InsertGangMissionAttempt): Promise<GangMissionAttempt> {
    const id = this.gangMissionAttemptIdCounter++;
    const newAttempt: GangMissionAttempt = {
      ...attempt,
      id,
      startedAt: new Date(),
      completedAt: null,
      progress: 0,
      isCompleted: false
    };
    
    this.gangMissionAttempts.set(id, newAttempt);
    return newAttempt;
  }
  
  async updateGangMissionAttempt(id: number, data: Partial<GangMissionAttempt>): Promise<GangMissionAttempt | undefined> {
    const attempt = this.gangMissionAttempts.get(id);
    if (!attempt) return undefined;
    
    const updatedAttempt = { ...attempt, ...data };
    
    // If the mission is being completed, set the completion time
    if (data.isCompleted === true && !attempt.isCompleted) {
      updatedAttempt.completedAt = new Date();
      updatedAttempt.progress = 100;
      
      // Award the gang for completing the mission
      const mission = await this.getGangMission(attempt.missionId);
      if (mission) {
        const gang = await this.getGang(attempt.gangId);
        if (gang) {
          const updatedGang = {
            ...gang,
            bankBalance: gang.bankBalance + mission.cashReward,
            respect: gang.respect + mission.respectReward
          };
          this.gangs.set(gang.id, updatedGang);
        }
      }
    }
    
    this.gangMissionAttempts.set(id, updatedAttempt);
    return updatedAttempt;
  }
  
  async getGangMissionAttempt(gangId: number, missionId: number): Promise<GangMissionAttempt | undefined> {
    return Array.from(this.gangMissionAttempts.values()).find(
      attempt => attempt.gangId === gangId && 
                attempt.missionId === missionId && 
                !attempt.isCompleted
    );
  }
  
  async getCompletedGangMissions(gangId: number): Promise<(GangMission & { completedAt: Date })[]> {
    const completedAttempts = Array.from(this.gangMissionAttempts.values())
      .filter(attempt => attempt.gangId === gangId && attempt.isCompleted && attempt.completedAt);
    
    const results = await Promise.all(
      completedAttempts.map(async (attempt) => {
        const mission = await this.getGangMission(attempt.missionId);
        if (!mission) return null;
        
        return {
          ...mission,
          completedAt: attempt.completedAt as Date
        };
      })
    );
    
    return results.filter((mission): mission is (GangMission & { completedAt: Date }) => mission !== null);
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

  // Challenge methods
  async getAllChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values());
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    const now = new Date();
    return Array.from(this.challenges.values())
      .filter(challenge => 
        challenge.active && 
        challenge.startDate <= now &&
        challenge.endDate >= now
      );
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = this.challengeIdCounter++;
    const challenge: Challenge = { ...insertChallenge, id };
    this.challenges.set(id, challenge);
    return challenge;
  }

  async updateChallenge(id: number, challengeData: Partial<Challenge>): Promise<Challenge | undefined> {
    const challenge = await this.getChallenge(id);
    if (!challenge) return undefined;
    
    const updatedChallenge = { ...challenge, ...challengeData };
    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async deleteChallenge(id: number): Promise<boolean> {
    const challenge = await this.getChallenge(id);
    if (!challenge) return false;
    
    return this.challenges.delete(id);
  }

  async getChallengesWithProgress(userId: number): Promise<ChallengeWithProgress[]> {
    const activeChallenges = await this.getActiveChallenges();
    const userProgressEntries = Array.from(this.challengeProgress.values())
      .filter(progress => progress.userId === userId);
    
    return activeChallenges.map(challenge => {
      const progress = userProgressEntries.find(p => p.challengeId === challenge.id);
      
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
    return Array.from(this.challengeProgress.values())
      .find(progress => progress.userId === userId && progress.challengeId === challengeId);
  }

  async createChallengeProgress(insertProgress: InsertChallengeProgress): Promise<ChallengeProgress> {
    const id = this.challengeProgressIdCounter++;
    const progress: ChallengeProgress = { 
      ...insertProgress, 
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.challengeProgress.set(id, progress);
    return progress;
  }

  async updateChallengeProgress(userId: number, challengeId: number, data: Partial<ChallengeProgress>): Promise<ChallengeProgress | undefined> {
    const progress = await this.getChallengeProgress(userId, challengeId);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...data };
    if (data.completed && !progress.completed) {
      updatedProgress.completedAt = new Date();
    }
    
    this.challengeProgress.set(progress.id, updatedProgress);
    return updatedProgress;
  }

  async createChallengeReward(insertReward: InsertChallengeReward): Promise<ChallengeReward> {
    const id = this.challengeRewardIdCounter++;
    const reward: ChallengeReward = { 
      ...insertReward, 
      id,
      awardedAt: new Date(),
    };
    this.challengeRewards.set(id, reward);
    return reward;
  }

  async getUserChallengeRewards(userId: number, limit: number = 10): Promise<ChallengeReward[]> {
    const userRewards = Array.from(this.challengeRewards.values())
      .filter(reward => reward.userId === userId)
      .sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime());
    
    return limit ? userRewards.slice(0, limit) : userRewards;
  }
}

// This is now handled by the DatabaseStorage implementation at the top of the file
// const memStorage = new MemStorage();
