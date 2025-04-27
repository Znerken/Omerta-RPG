import { pgTable, text, serial, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

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
  ownerId: integer("leader_id").notNull(),
});

// Gang Members Schema
export const gangMembers = pgTable("gang_members", {
  id: serial("id").primaryKey(),
  gangId: integer("gang_id").notNull().references(() => gangs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rank: text("rank").notNull().default("Soldier"), // Leader, Underboss, Capo, Soldier
  contribution: integer("contribution").notNull().default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    gangMemberUserIdIdx: index("gang_member_user_id_idx").on(table.userId),
    gangMemberGangIdIdx: index("gang_member_gang_id_idx").on(table.gangId),
  };
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
  cooldown: integer("cooldown").notNull(), // in minutes
  isActive: boolean("is_active").notNull().default(true),
});

// Gang Mission Attempts Schema
export const gangMissionAttempts = pgTable("gang_mission_attempts", {
  id: serial("id").primaryKey(),
  gangId: integer("gang_id").notNull().references(() => gangs.id),
  missionId: integer("mission_id").notNull().references(() => gangMissions.id),
  status: text("status").notNull(), // in-progress, completed, rewarded, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  nextAvailableAt: timestamp("next_available_at"),
});

// Create insert schemas
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
});

export const insertGangWarParticipantSchema = createInsertSchema(gangWarParticipants).pick({
  warId: true,
  userId: true,
  gangId: true,
});

export const insertGangMissionSchema = createInsertSchema(gangMissions);

export const insertGangMissionAttemptSchema = createInsertSchema(gangMissionAttempts).pick({
  gangId: true,
  missionId: true,
  status: true,
  completedAt: true,
  nextAvailableAt: true,
});

// Define types
export type Gang = typeof gangs.$inferSelect;
export type InsertGang = z.infer<typeof insertGangSchema>;

export type GangMember = typeof gangMembers.$inferSelect;
export type InsertGangMember = z.infer<typeof insertGangMemberSchema>;

export type GangTerritory = typeof gangTerritories.$inferSelect;
export type InsertGangTerritory = z.infer<typeof insertGangTerritorySchema>;

export type GangWar = typeof gangWars.$inferSelect;
export type InsertGangWar = z.infer<typeof insertGangWarSchema>;

export type GangWarParticipant = typeof gangWarParticipants.$inferSelect;
export type InsertGangWarParticipant = z.infer<typeof insertGangWarParticipantSchema>;

export type GangMission = typeof gangMissions.$inferSelect;
export type InsertGangMission = z.infer<typeof insertGangMissionSchema>;

export type GangMissionAttempt = typeof gangMissionAttempts.$inferSelect;
export type InsertGangMissionAttempt = z.infer<typeof insertGangMissionAttemptSchema>;