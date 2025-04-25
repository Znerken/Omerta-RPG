import { relations } from "drizzle-orm";
import { integer, json, pgTable, serial, text, timestamp, boolean, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Casino database schema

// Game types enum
export const casinoGameTypeEnum = pgEnum('casino_game_type', [
  'dice', 
  'slots', 
  'roulette', 
  'blackjack'
]);

// Bet status enum
export const casinoBetStatusEnum = pgEnum('casino_bet_status', [
  'pending', 
  'won', 
  'lost', 
  'canceled', 
  'refunded'
]);

// Casino Games
export const casinoGames = pgTable('casino_games', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('game_type').notNull(),
  description: text('description'),
  isActive: boolean('enabled').default(true).notNull(),
  minBet: integer('min_bet').default(10).notNull(),
  maxBet: integer('max_bet').default(10000).notNull(),
  houseEdge: real('house_edge').default(0.05).notNull(), // 5% house edge
  imageUrl: text('image_url'),
});

// Casino Bets
export const casinoBets = pgTable('casino_bets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  gameId: integer('game_id').notNull().references(() => casinoGames.id),
  betAmount: integer('bet_amount').notNull(),
  betDetails: json('bet_details').notNull().$type<{ [key: string]: any }>(),
  result: json('result').$type<{
    win: boolean;
    amount: number;
    details?: { [key: string]: any };
  }>(),
  status: casinoBetStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  settledAt: timestamp('settled_at'),
});

// Casino User Stats
export const casinoStats = pgTable('casino_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  gameId: integer('game_id').notNull().references(() => casinoGames.id),
  totalBets: integer('total_bets').default(0).notNull(),
  totalWagered: integer('total_wagered').default(0).notNull(),
  totalWon: integer('total_won').default(0).notNull(),
  totalLost: integer('total_lost').default(0).notNull(),
  biggestWin: integer('biggest_win').default(0).notNull(),
  biggestLoss: integer('biggest_loss').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const casinoGamesRelations = relations(casinoGames, ({ many }) => ({
  bets: many(casinoBets),
  stats: many(casinoStats),
}));

export const casinoBetsRelations = relations(casinoBets, ({ one }) => ({
  user: one(users, {
    fields: [casinoBets.userId],
    references: [users.id]
  }),
  game: one(casinoGames, {
    fields: [casinoBets.gameId],
    references: [casinoGames.id]
  }),
}));

export const casinoStatsRelations = relations(casinoStats, ({ one }) => ({
  user: one(users, {
    fields: [casinoStats.userId],
    references: [users.id]
  }),
  game: one(casinoGames, {
    fields: [casinoStats.gameId],
    references: [casinoGames.id]
  }),
}));

// Types
export type CasinoGame = typeof casinoGames.$inferSelect;
export type InsertCasinoGame = typeof casinoGames.$inferInsert;
export type CasinoBet = typeof casinoBets.$inferSelect;
export type InsertCasinoBet = typeof casinoBets.$inferInsert;
export type CasinoStat = typeof casinoStats.$inferSelect;
export type InsertCasinoStat = typeof casinoStats.$inferInsert;

// Zod schemas
export const insertCasinoGameSchema = createInsertSchema(casinoGames);
export const insertCasinoBetSchema = createInsertSchema(casinoBets);
export const insertCasinoStatSchema = createInsertSchema(casinoStats);

// Additional type for fetching a bet with its relations
export type CasinoBetWithDetails = CasinoBet & {
  user: Pick<typeof users.$inferSelect, 'id' | 'username'>;
  game: CasinoGame;
};

// Bet validation schema
export const placeBetSchema = z.object({
  gameId: z.number().positive(),
  betAmount: z.number().positive(),
  betDetails: z.record(z.any()),
});