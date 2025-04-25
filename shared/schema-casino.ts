import { relations } from "drizzle-orm";
import { pgTable, serial, integer, timestamp, varchar, text, decimal, boolean, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './schema';

// Casino Games
export const casinoGames = pgTable('casino_games', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  minBet: integer('min_bet').notNull().default(100),
  maxBet: integer('max_bet').notNull().default(10000),
  houseEdge: decimal('house_edge').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  rules: json('rules').$type<{[key: string]: any}>(),
  imageUrl: varchar('image_url', { length: 255 }),
});

// Casino Game Relations
export const casinoGamesRelations = relations(casinoGames, ({ many }) => ({
  bets: many(casinoBets),
}));

// Casino Bets
export const casinoBets = pgTable('casino_bets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: integer('game_id').references(() => casinoGames.id, { onDelete: 'cascade' }).notNull(),
  betAmount: integer('bet_amount').notNull(),
  betDetails: json('bet_details').$type<{[key: string]: any}>().notNull(),
  result: json('result').$type<{win: boolean, amount: number, details?: {[key: string]: any}}>(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, won, lost
  createdAt: timestamp('created_at').defaultNow().notNull(),
  settledAt: timestamp('settled_at'),
});

// Casino Bet Relations
export const casinoBetsRelations = relations(casinoBets, ({ one }) => ({
  user: one(users, {
    fields: [casinoBets.userId],
    references: [users.id],
  }),
  game: one(casinoGames, {
    fields: [casinoBets.gameId],
    references: [casinoGames.id],
  }),
}));

// Game Stats
export const casinoStats = pgTable('casino_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gameId: integer('game_id').references(() => casinoGames.id, { onDelete: 'cascade' }).notNull(),
  totalBets: integer('total_bets').notNull().default(0),
  totalWagered: integer('total_wagered').notNull().default(0),
  totalWon: integer('total_won').notNull().default(0),
  totalLost: integer('total_lost').notNull().default(0),
  biggestWin: integer('biggest_win').notNull().default(0),
  biggestLoss: integer('biggest_loss').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Casino Stats Relations
export const casinoStatsRelations = relations(casinoStats, ({ one }) => ({
  user: one(users, {
    fields: [casinoStats.userId],
    references: [users.id],
  }),
  game: one(casinoGames, {
    fields: [casinoStats.gameId],
    references: [casinoGames.id],
  }),
}));

// Schemas for insertions
export const insertCasinoGameSchema = createInsertSchema(casinoGames).omit({ id: true });
export const insertCasinoBetSchema = createInsertSchema(casinoBets).omit({ id: true, createdAt: true, settledAt: true });
export const insertCasinoStatSchema = createInsertSchema(casinoStats).omit({ id: true, updatedAt: true });

// Types
export type CasinoGame = typeof casinoGames.$inferSelect;
export type InsertCasinoGame = typeof casinoGames.$inferInsert;

export type CasinoBet = typeof casinoBets.$inferSelect;
export type InsertCasinoBet = typeof casinoBets.$inferInsert;

export type CasinoStat = typeof casinoStats.$inferSelect;
export type InsertCasinoStat = typeof casinoStats.$inferInsert;

// Extended types with relations
export type CasinoGameWithBets = CasinoGame & {
  bets: CasinoBet[];
};

export type CasinoBetWithDetails = CasinoBet & {
  game: CasinoGame;
  user: {
    id: number;
    username: string;
  };
};

// Validation schemas
export const placeBetSchema = z.object({
  gameId: z.number().positive(),
  betAmount: z.number().min(1),
  betDetails: z.record(z.any()),
});

export type PlaceBetInput = z.infer<typeof placeBetSchema>;