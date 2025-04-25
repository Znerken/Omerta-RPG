import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from './db';
import { users } from '../shared/schema';
import { 
  type CasinoGame, 
  type CasinoBet, 
  type CasinoStat, 
  type InsertCasinoGame, 
  type InsertCasinoBet, 
  type InsertCasinoStat,
  type CasinoBetWithDetails,
  casinoGames,
  casinoBets,
  casinoStats,
} from '../shared/schema-casino';

export class CasinoStorage {
  // Casino Games
  async getAllCasinoGames(): Promise<CasinoGame[]> {
    return await db.select().from(casinoGames).where(eq(casinoGames.isActive, true));
  }

  async getCasinoGame(id: number): Promise<CasinoGame | undefined> {
    const [game] = await db.select().from(casinoGames).where(eq(casinoGames.id, id));
    return game;
  }

  async createCasinoGame(game: InsertCasinoGame): Promise<CasinoGame> {
    const [newGame] = await db.insert(casinoGames).values(game).returning();
    return newGame;
  }

  async updateCasinoGame(id: number, gameData: Partial<CasinoGame>): Promise<CasinoGame | undefined> {
    const [updatedGame] = await db
      .update(casinoGames)
      .set({
        ...gameData,
        updatedAt: new Date(),
      })
      .where(eq(casinoGames.id, id))
      .returning();
    
    return updatedGame;
  }

  // Casino Bets
  async createBet(bet: InsertCasinoBet): Promise<CasinoBet> {
    const [newBet] = await db.insert(casinoBets).values(bet).returning();
    return newBet;
  }

  async updateBetResult(
    id: number, 
    result: { win: boolean; amount: number; details?: { [key: string]: any } },
    status: "pending" | "won" | "lost" | "canceled" | "refunded"
  ): Promise<CasinoBet | undefined> {
    const [updatedBet] = await db
      .update(casinoBets)
      .set({
        result,
        status,
        settledAt: new Date(),
      })
      .where(eq(casinoBets.id, id))
      .returning();
    
    return updatedBet;
  }

  async getUserBets(userId: number, limit: number = 10): Promise<CasinoBetWithDetails[]> {
    return await db.query.casinoBets.findMany({
      where: eq(casinoBets.userId, userId),
      with: {
        game: true,
        user: {
          columns: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: [desc(casinoBets.createdAt)],
      limit
    });
  }

  async getRecentBets(limit: number = 10): Promise<CasinoBetWithDetails[]> {
    return await db.query.casinoBets.findMany({
      with: {
        game: true,
        user: {
          columns: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: [desc(casinoBets.createdAt)],
      limit
    });
  }

  async getBiggestWins(limit: number = 10): Promise<CasinoBetWithDetails[]> {
    return await db.query.casinoBets.findMany({
      where: eq(casinoBets.status, 'won'),
      with: {
        game: true,
        user: {
          columns: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: [desc(sql`(casino_bets.result->>'amount')::int`)],
      limit
    });
  }

  // Casino Stats
  async getUserGameStats(userId: number, gameId: number): Promise<CasinoStat | undefined> {
    const [stats] = await db.select()
      .from(casinoStats)
      .where(
        and(
          eq(casinoStats.userId, userId),
          eq(casinoStats.gameId, gameId)
        )
      );
    
    return stats;
  }

  async createUserGameStats(stats: InsertCasinoStat): Promise<CasinoStat> {
    const [newStats] = await db.insert(casinoStats).values(stats).returning();
    return newStats;
  }

  async updateUserGameStats(
    userId: number, 
    gameId: number, 
    betAmount: number, 
    winAmount: number, 
    isWin: boolean
  ): Promise<CasinoStat> {
    // Try to get existing stats first
    let stats = await this.getUserGameStats(userId, gameId);
    
    if (!stats) {
      // Create new stats if they don't exist
      stats = await this.createUserGameStats({
        userId,
        gameId,
        totalBets: 1,
        totalWagered: betAmount,
        totalWon: isWin ? winAmount : 0,
        totalLost: isWin ? 0 : betAmount,
        biggestWin: isWin ? winAmount : 0,
        biggestLoss: isWin ? 0 : betAmount
      });
    } else {
      // Update existing stats
      const [updatedStats] = await db
        .update(casinoStats)
        .set({
          totalBets: stats.totalBets + 1,
          totalWagered: stats.totalWagered + betAmount,
          totalWon: stats.totalWon + (isWin ? winAmount : 0),
          totalLost: stats.totalLost + (isWin ? 0 : betAmount),
          biggestWin: isWin && winAmount > stats.biggestWin ? winAmount : stats.biggestWin,
          biggestLoss: !isWin && betAmount > stats.biggestLoss ? betAmount : stats.biggestLoss,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(casinoStats.userId, userId),
            eq(casinoStats.gameId, gameId)
          )
        )
        .returning();
      
      stats = updatedStats;
    }
    
    return stats;
  }

  async getUserStats(userId: number): Promise<CasinoStat[]> {
    return await db.query.casinoStats.findMany({
      where: eq(casinoStats.userId, userId),
      with: {
        game: true,
      }
    });
  }

  async getTopWinners(limit: number = 10): Promise<any[]> {
    const result = await db
      .select({
        userId: casinoStats.userId,
        username: users.username,
        totalWon: sql<number>`SUM(${casinoStats.totalWon})`,
        totalLost: sql<number>`SUM(${casinoStats.totalLost})`,
        netProfit: sql<number>`SUM(${casinoStats.totalWon}) - SUM(${casinoStats.totalLost})`,
      })
      .from(casinoStats)
      .innerJoin(users, eq(casinoStats.userId, users.id))
      .groupBy(casinoStats.userId, users.username)
      .orderBy(desc(sql`SUM(${casinoStats.totalWon}) - SUM(${casinoStats.totalLost})`))
      .limit(limit);

    return result;
  }
}