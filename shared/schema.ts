import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import economy types
import * as Economy from "./schema-economy";

// Session Schema for authentication (matching existing database)
// Note: We're skipping schema validation for this table to avoid
// losing session data since it's maintained by connect-pg-simple
// Using varchar for sid to match existing database structure
// Drizzle will ignore this table during migrations
import { sql } from "drizzle-orm";
export const sessions = pgTable("session", {
  sid: text("sid", { mode: "varchar" }).primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6, mode: "timestamp" }).notNull(),
}, (table) => {
  return {
    expireIdx: index("IDX_session_expire").on(table.expire),
  }
});

// ========== Core Game Tables ==========
// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  cash: integer("cash").notNull().default(1000),
  respect: integer("respect").notNull().default(0),
  // Basic user data
  avatar: text("avatar"),
  bannerImage: text("banner_image"),
  bio: text("bio"),
  htmlProfile: text("html_profile"),
  profileTheme: text("profile_theme"),
  showAchievements: boolean("show_achievements").default(true),
  isAdmin: boolean("is_admin").notNull().default(false),
  isJailed: boolean("is_jailed").notNull().default(false),
  jailTimeEnd: timestamp("jail_time_end"),
  // Ban information
  banExpiry: timestamp("ban_expiry"),
  banReason: text("ban_reason"),
  gangId: integer("gang_id"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // NOTE: Economy-related fields - Commented out until database migration is complete
  // These will be added in a future migration
  // bankBalance: integer("bank_balance").notNull().default(0),
  // investmentBalance: integer("investment_balance").notNull().default(0),
  // netWorth: integer("net_worth").notNull().default(1000), // Cash + bank + investments + assets
  // creditScore: integer("credit_score").notNull().default(500), // 300-850 range
  // taxRate: integer("tax_rate").notNull().default(15), // Percentage
  // lastIncome: timestamp("last_income"), // For passive income timing
  // lastInterest: timestamp("last_interest"), // For bank interest timing
});

// Stats Schema
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  strength: integer("strength").notNull().default(10),
  stealth: integer("stealth").notNull().default(10),
  charisma: integer("charisma").notNull().default(10),
  intelligence: integer("intelligence").notNull().default(10),
  strengthTrainingCooldown: timestamp("strength_training_cooldown"),
  stealthTrainingCooldown: timestamp("stealth_training_cooldown"),
  charismaTrainingCooldown: timestamp("charisma_training_cooldown"),
  intelligenceTrainingCooldown: timestamp("intelligence_training_cooldown"),
});

// Crimes Schema
export const crimes = pgTable("crimes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minCashReward: integer("min_cash_reward").notNull(),
  maxCashReward: integer("max_cash_reward").notNull(),
  minXpReward: integer("min_xp_reward").notNull(),
  maxXpReward: integer("max_xp_reward").notNull(),
  jailRisk: integer("jail_risk").notNull(), // percentage
  jailTime: integer("jail_time").notNull(), // seconds
  cooldown: integer("cooldown").notNull(), // seconds
  strengthWeight: doublePrecision("strength_weight").notNull(),
  stealthWeight: doublePrecision("stealth_weight").notNull(),
  charismaWeight: doublePrecision("charisma_weight").notNull(),
  intelligenceWeight: doublePrecision("intelligence_weight").notNull(),
});

// Crime History Schema
export const crimeHistory = pgTable("crime_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  crimeId: integer("crime_id").notNull(),
  success: boolean("success").notNull(),
  cashReward: integer("cash_reward"),
  xpReward: integer("xp_reward"),
  jailed: boolean("jailed").notNull().default(false),
  timestamp: timestamp("timestamp").defaultNow(),
  nextAvailableAt: timestamp("next_available_at"),
});

// Items Schema
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // weapon, tool, protection, consumable
  price: integer("price").notNull(),
  strengthBonus: integer("strength_bonus").notNull().default(0),
  stealthBonus: integer("stealth_bonus").notNull().default(0),
  charismaBonus: integer("charisma_bonus").notNull().default(0),
  intelligenceBonus: integer("intelligence_bonus").notNull().default(0),
  crimeSuccessBonus: integer("crime_success_bonus").notNull().default(0),
  jailTimeReduction: integer("jail_time_reduction").notNull().default(0),
  escapeChanceBonus: integer("escape_chance_bonus").notNull().default(0),
});

// User Inventory Schema
export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemId: integer("item_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  equipped: boolean("equipped").notNull().default(false),
});

// Gangs Schema
export const gangs = pgTable("gangs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  tag: text("tag").notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  bankBalance: integer("bank_balance").notNull().default(0),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  respect: integer("respect").notNull().default(0),
  strength: integer("strength").notNull().default(10),
  defense: integer("defense").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
  ownerId: integer("owner_id").notNull(),
});

// Gang Members Schema
export const gangMembers = pgTable("gang_members", {
  id: serial("id").primaryKey(),
  gangId: integer("gang_id").notNull(),
  userId: integer("user_id").notNull(),
  rank: text("rank").notNull().default("Member"), // Leader, Officer, Member
  contribution: integer("contribution").notNull().default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Gang Territories Schema
export const gangTerritories = pgTable("gang_territories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  income: integer("income").notNull().default(0),
  defenseBonus: integer("defense_bonus").notNull().default(0),
  controlledBy: integer("controlled_by").references(() => gangs.id),
  attackCooldown: timestamp("attack_cooldown"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gang Wars Schema
export const gangWars = pgTable("gang_wars", {
  id: serial("id").primaryKey(),
  attackerId: integer("attacker_id").notNull().references(() => gangs.id),
  defenderId: integer("defender_id").notNull().references(() => gangs.id),
  territoryId: integer("territory_id").references(() => gangTerritories.id),
  status: text("status").notNull().default("pending"), // pending, active, completed
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  winnerId: integer("winner_id").references(() => gangs.id),
  attackStrength: integer("attack_strength").notNull().default(0),
  defenseStrength: integer("defense_strength").notNull().default(0),
});

// Gang War Participants Schema
export const gangWarParticipants = pgTable("gang_war_participants", {
  id: serial("id").primaryKey(),
  warId: integer("war_id").notNull().references(() => gangWars.id),
  userId: integer("user_id").notNull().references(() => users.id),
  gangId: integer("gang_id").notNull().references(() => gangs.id),
  contribution: integer("contribution").notNull().default(0),
  side: text("side").notNull(), // attacker, defender
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Gang Missions Schema
export const gangMissions = pgTable("gang_missions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard, extreme
  requiredMembers: integer("required_members").notNull().default(1),
  cashReward: integer("cash_reward").notNull().default(0),
  respectReward: integer("respect_reward").notNull().default(0),
  experienceReward: integer("experience_reward").notNull().default(0),
  duration: integer("duration").notNull(), // in minutes
  cooldown: integer("cooldown").notNull(), // in hours
  isActive: boolean("is_active").notNull().default(true),
});

// Gang Mission Attempts Schema
export const gangMissionAttempts = pgTable("gang_mission_attempts", {
  id: serial("id").primaryKey(),
  gangId: integer("gang_id").notNull().references(() => gangs.id),
  missionId: integer("mission_id").notNull().references(() => gangMissions.id),
  status: text("status").notNull(), // in-progress, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  nextAvailableAt: timestamp("next_available_at"),
});

// Messages Schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id"),
  gangId: integer("gang_id"),
  type: text("type").notNull(), // personal, gang, jail, global
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Friends system
export const userFriends = pgTable("user_friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Online status tracking
export const userStatus = pgTable("user_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  status: text("status").notNull().default("offline"), // online, offline, away, busy
  lastActive: timestamp("last_active").defaultNow(),
  lastLocation: text("last_location"), // The last page the user was on
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertStatSchema = createInsertSchema(stats).pick({
  userId: true,
});

export const insertCrimeSchema = createInsertSchema(crimes);

export const insertCrimeHistorySchema = createInsertSchema(crimeHistory).pick({
  userId: true,
  crimeId: true,
  success: true,
  cashReward: true,
  xpReward: true,
  jailed: true,
  nextAvailableAt: true,
});

export const insertItemSchema = createInsertSchema(items);

export const insertUserInventorySchema = createInsertSchema(userInventory).pick({
  userId: true,
  itemId: true,
  quantity: true,
});

export const insertGangSchema = createInsertSchema(gangs).pick({
  name: true,
  tag: true,
  description: true,
  logo: true,
  ownerId: true,
});

export const insertGangMemberSchema = createInsertSchema(gangMembers).pick({
  gangId: true,
  userId: true,
  rank: true,
});

export const insertGangTerritorySchema = createInsertSchema(gangTerritories).pick({
  name: true,
  description: true,
  income: true,
  defenseBonus: true,
  image: true,
});

export const insertGangWarSchema = createInsertSchema(gangWars).pick({
  attackerId: true,
  defenderId: true,
  territoryId: true,
  status: true,
  attackStrength: true,
  defenseStrength: true,
});

export const insertGangWarParticipantSchema = createInsertSchema(gangWarParticipants).pick({
  warId: true,
  userId: true,
  gangId: true,
  contribution: true,
  side: true,
});

export const insertGangMissionSchema = createInsertSchema(gangMissions);

export const insertGangMissionAttemptSchema = createInsertSchema(gangMissionAttempts).pick({
  gangId: true,
  missionId: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  gangId: true,
  type: true,
  content: true,
});

export const insertUserFriendSchema = createInsertSchema(userFriends).pick({
  userId: true,
  friendId: true,
  status: true,
});

export const insertUserStatusSchema = createInsertSchema(userStatus).pick({
  userId: true,
  status: true,
  lastLocation: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertUserFriend = z.infer<typeof insertUserFriendSchema>;
export type InsertUserStatus = z.infer<typeof insertUserStatusSchema>;
export type UserFriend = typeof userFriends.$inferSelect;
export type UserStatus = typeof userStatus.$inferSelect;

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStat = z.infer<typeof insertStatSchema>;
export type Stat = typeof stats.$inferSelect;

export type InsertCrime = z.infer<typeof insertCrimeSchema>;
export type Crime = typeof crimes.$inferSelect;

export type InsertCrimeHistory = z.infer<typeof insertCrimeHistorySchema>;
export type CrimeHistory = typeof crimeHistory.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type InsertUserInventory = z.infer<typeof insertUserInventorySchema>;
export type UserInventory = typeof userInventory.$inferSelect;

export type InsertGang = z.infer<typeof insertGangSchema>;
export type Gang = typeof gangs.$inferSelect;

export type InsertGangMember = z.infer<typeof insertGangMemberSchema>;
export type GangMember = typeof gangMembers.$inferSelect;

export type InsertGangTerritory = z.infer<typeof insertGangTerritorySchema>;
export type GangTerritory = typeof gangTerritories.$inferSelect;

export type InsertGangWar = z.infer<typeof insertGangWarSchema>;
export type GangWar = typeof gangWars.$inferSelect;

export type InsertGangWarParticipant = z.infer<typeof insertGangWarParticipantSchema>;
export type GangWarParticipant = typeof gangWarParticipants.$inferSelect;

export type InsertGangMission = z.infer<typeof insertGangMissionSchema>;
export type GangMission = typeof gangMissions.$inferSelect;

export type InsertGangMissionAttempt = z.infer<typeof insertGangMissionAttemptSchema>;
export type GangMissionAttempt = typeof gangMissionAttempts.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Custom Types for Frontend
export type UserWithStats = User & {
  stats: Stat;
};

export type UserWithGang = User & {
  gang?: Gang;
  gangRank?: string;
};

export type UserWithStatus = User & {
  status: UserStatus;
  isFriend: boolean;
  friendStatus?: string;
  friendRequest?: UserFriend;
};

export type CrimeWithHistory = Crime & {
  lastPerformed?: CrimeHistory;
  successChance: number;
};

export type ItemWithDetails = Item & {
  equipped: boolean;
  quantity: number;
};

export type GangWithMembers = Gang & {
  members: (User & { rank: string })[];
};

export type GangWithDetails = Gang & {
  members: (User & { rank: string; contribution: number })[];
  territories: GangTerritory[];
  activeWars: GangWar[];
  activeMissions: (GangMission & { attempt: GangMissionAttempt })[];
};

export type GangWarWithDetails = GangWar & {
  attacker: Gang;
  defender: Gang;
  territory?: GangTerritory; 
  participants: (GangWarParticipant & { user: User })[];
};

export type GangTerritoryWithDetails = GangTerritory & {
  controller?: Gang;
};

export type GangMissionWithDetails = GangMission & { 
  currentAttempt?: GangMissionAttempt;
  canAttempt: boolean;
};

// Weekly challenges system
export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // 'crime', 'gang', 'banking', etc.
  difficulty: text('difficulty').notNull().default('medium'), // 'easy', 'medium', 'hard', 'boss'
  startDate: timestamp('start_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  cashReward: integer('cash_reward').notNull(),
  xpReward: integer('xp_reward').notNull(),
  respectReward: integer('respect_reward').notNull().default(0),
  specialItemId: integer('special_item_id').references(() => items.id),
  requirementType: text('requirement_type').notNull(), // 'count', 'amount', 'specific', etc.
  requirementValue: integer('requirement_value').notNull(),
  requirementTarget: text('requirement_target').notNull(), // target crime ID, amount of cash, etc.
  active: boolean('active').notNull().default(true),
  timeLimit: integer('time_limit'), // optional time limit in seconds
  imageUrl: text('image_url'),
});

export const challengeProgress = pgTable('challenge_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  challengeId: integer('challenge_id').notNull().references(() => challenges.id),
  currentValue: integer('current_value').notNull().default(0),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  claimed: boolean('claimed').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// Challenge reward history
export const challengeRewards = pgTable('challenge_rewards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  challengeId: integer('challenge_id').notNull().references(() => challenges.id),
  cashReward: integer('cash_reward').notNull(),
  xpReward: integer('xp_reward').notNull(),
  respectReward: integer('respect_reward').notNull(),
  specialItemId: integer('special_item_id').references(() => items.id),
  awardedAt: timestamp('awarded_at', { mode: 'date' }).notNull().defaultNow(),
});

// Create insert schemas for challenges
export const insertChallengeSchema = createInsertSchema(challenges);
export const insertChallengeProgressSchema = createInsertSchema(challengeProgress).pick({
  userId: true,
  challengeId: true,
  currentValue: true,
  completed: true,
  claimed: true,
});
export const insertChallengeRewardSchema = createInsertSchema(challengeRewards).pick({
  userId: true,
  challengeId: true,
  cashReward: true,
  xpReward: true,
  respectReward: true,
  specialItemId: true,
});

// Define challenge types
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export type InsertChallengeProgress = z.infer<typeof insertChallengeProgressSchema>;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;

export type InsertChallengeReward = z.infer<typeof insertChallengeRewardSchema>;
export type ChallengeReward = typeof challengeRewards.$inferSelect;

// Custom types for challenges
export type ChallengeWithProgress = Challenge & {
  progress?: ChallengeProgress;
  completed: boolean;
  claimed: boolean;
  currentValue: number;
};

// Re-export economy types for use in the app
export type { 
  BankAccount, Company, CompanyEmployee, 
  Loan, Asset, UserAsset,
  BankTransaction, CompanyTransaction,
  BettingEvent, BettingOption, Bet,
  CasinoGame, CasinoHistory
} from "./schema-economy";

export type { 
  CompanyWithDetails, BettingEventWithOptions,
  UserWithFinancials
} from "./schema-economy";

// Achievement system
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),
  category: text('category').notNull(),
  requirementType: text('requirement_type').notNull(),
  requirementValue: integer('requirement_value').notNull(),
  cashReward: integer('cash_reward').notNull().default(0),
  respectReward: integer('respect_reward').notNull().default(0),
  xpReward: integer('xp_reward').notNull().default(0),
  hidden: boolean('hidden').notNull().default(false),
  secretDescription: text('secret_description'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

// User achievement schema
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  achievementId: integer('achievement_id').notNull().references(() => achievements.id),
  unlockedAt: timestamp('unlocked_at', { mode: 'date' }).notNull().defaultNow(),
  viewed: boolean('viewed').notNull().default(false),
});

// Create insert schemas for achievements
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  viewed: true,
});

// Define achievement types
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// Custom type for achievements with unlocked status
export type AchievementWithUnlocked = Achievement & { 
  unlocked: boolean, 
  unlockedAt?: Date, 
  viewed: boolean 
};

// ========== Drug System Tables ==========
// Drug Schema
export const drugs = pgTable("drugs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  basePrice: integer("base_price").notNull(),
  riskLevel: integer("risk_level").notNull().default(1), // 1-10 scale
  addictionRate: integer("addiction_rate").notNull().default(0), // 0-100%
  strengthBonus: integer("strength_bonus").default(0),
  stealthBonus: integer("stealth_bonus").default(0),
  charismaBonus: integer("charisma_bonus").default(0),
  intelligenceBonus: integer("intelligence_bonus").default(0),
  cashGainBonus: integer("cash_gain_bonus").default(0),
  durationHours: integer("duration_hours").notNull(),
  sideEffects: text("side_effects"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDrugSchema = createInsertSchema(drugs).omit({
  id: true,
  createdAt: true,
});

// Drug Ingredient Schema
export const drugIngredients = pgTable("drug_ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  rarity: integer("rarity").notNull().default(1), // 1-10 scale
  image: text("image"),
});

export const insertDrugIngredientSchema = createInsertSchema(drugIngredients).omit({
  id: true,
});

// Drug Recipe Schema
export const drugRecipes = pgTable("drug_recipes", {
  id: serial("id").primaryKey(),
  drugId: integer("drug_id").notNull().references(() => drugs.id),
  ingredientId: integer("ingredient_id").notNull().references(() => drugIngredients.id),
  quantity: integer("quantity").notNull().default(1),
});

export const insertDrugRecipeSchema = createInsertSchema(drugRecipes).omit({
  id: true,
});

// User Drug Inventory Schema
export const userDrugs = pgTable("user_drugs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  drugId: integer("drug_id").notNull().references(() => drugs.id),
  quantity: integer("quantity").notNull().default(1),
  acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
});

export const insertUserDrugSchema = createInsertSchema(userDrugs).omit({
  id: true,
  acquiredAt: true,
});

// User Ingredient Inventory Schema
export const userIngredients = pgTable("user_ingredients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ingredientId: integer("ingredient_id").notNull().references(() => drugIngredients.id),
  quantity: integer("quantity").notNull().default(1),
  acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
});

export const insertUserIngredientSchema = createInsertSchema(userIngredients).omit({
  id: true,
  acquiredAt: true,
});

// Drug Lab Schema
export const drugLabs = pgTable("drug_labs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  securityLevel: integer("security_level").notNull().default(1),
  capacity: integer("capacity").notNull().default(10),
  costToUpgrade: integer("cost_to_upgrade").notNull(),
  location: text("location").notNull(),
  discoveryChance: integer("discovery_chance").notNull().default(5), // percentage
  riskModifier: integer("risk_modifier").default(0), // percentage added to base discovery chance
  productionModifier: integer("production_modifier").default(0), // percentage speed/efficiency boost
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastRaidedAt: timestamp("last_raided_at"),
});

export const insertDrugLabSchema = createInsertSchema(drugLabs).omit({
  id: true,
  createdAt: true,
  lastRaidedAt: true,
});

// Drug Production Schema
export const drugProduction = pgTable("drug_production", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id").notNull().references(() => drugLabs.id),
  drugId: integer("drug_id").notNull().references(() => drugs.id),
  quantity: integer("quantity").notNull().default(1),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completesAt: timestamp("completes_at").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  successRate: integer("success_rate").notNull().default(90), // percentage
});

export const insertDrugProductionSchema = createInsertSchema(drugProduction).omit({
  id: true,
  startedAt: true,
  isCompleted: true,
  completesAt: true, // Server will calculate this
});

// Drug Deal Schema
export const drugDeals = pgTable("drug_deals", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  buyerId: integer("buyer_id").references(() => users.id),
  drugId: integer("drug_id").notNull().references(() => drugs.id),
  quantity: integer("quantity").notNull().default(1),
  pricePerUnit: integer("price_per_unit").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed, cancelled
  isPublic: boolean("is_public").notNull().default(false),
  riskLevel: integer("risk_level").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertDrugDealSchema = createInsertSchema(drugDeals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Drug Addiction Schema
export const drugAddictions = pgTable("drug_addictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  drugId: integer("drug_id").notNull().references(() => drugs.id),
  level: integer("level").notNull().default(1), // 1-10 scale
  withdrawalEffect: text("withdrawal_effect").notNull(),
  lastDosage: timestamp("last_dosage").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDrugAddictionSchema = createInsertSchema(drugAddictions).omit({
  id: true,
  createdAt: true,
  lastDosage: true,
});

// Drug Territory Schema
export const drugTerritories = pgTable("drug_territories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  controlledBy: integer("controlled_by").references(() => gangs.id),
  profitModifier: integer("profit_modifier").notNull().default(100), // percentage
  riskModifier: integer("risk_modifier").notNull().default(100), // percentage
  reputationRequired: integer("reputation_required").notNull().default(0),
  image: text("image"),
});

export const insertDrugTerritorySchema = createInsertSchema(drugTerritories).omit({
  id: true,
});

// Type definitions
export type Drug = typeof drugs.$inferSelect;
export type InsertDrug = z.infer<typeof insertDrugSchema>;

export type DrugIngredient = typeof drugIngredients.$inferSelect;
export type InsertDrugIngredient = z.infer<typeof insertDrugIngredientSchema>;

export type DrugRecipe = typeof drugRecipes.$inferSelect;
export type InsertDrugRecipe = z.infer<typeof insertDrugRecipeSchema>;

export type UserDrug = typeof userDrugs.$inferSelect;
export type InsertUserDrug = z.infer<typeof insertUserDrugSchema>;

export type UserIngredient = typeof userIngredients.$inferSelect;
export type InsertUserIngredient = z.infer<typeof insertUserIngredientSchema>;

export type DrugLab = typeof drugLabs.$inferSelect;
export type InsertDrugLab = z.infer<typeof insertDrugLabSchema>;

export type DrugProduction = typeof drugProduction.$inferSelect;
export type InsertDrugProduction = z.infer<typeof insertDrugProductionSchema>;

export type DrugDeal = typeof drugDeals.$inferSelect;
export type InsertDrugDeal = z.infer<typeof insertDrugDealSchema>;

export type DrugAddiction = typeof drugAddictions.$inferSelect;
export type InsertDrugAddiction = z.infer<typeof insertDrugAddictionSchema>;

export type DrugTerritory = typeof drugTerritories.$inferSelect;
export type InsertDrugTerritory = z.infer<typeof insertDrugTerritorySchema>;

// Custom type for drugs with quantity from user inventory
export type DrugWithQuantity = Drug & { 
  quantity: number 
};

// Custom type for drug with recipes and ingredients
export type DrugWithRecipe = Drug & {
  recipes: (DrugRecipe & { 
    ingredient: DrugIngredient
  })[]
};