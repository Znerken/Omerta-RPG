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
    // Convert to the actual database schema structure
    const formattedBet = {
      user_id: bet.userId,
      game_id: bet.gameId,
      bet_amount: bet.betAmount,
      status: bet.status || 'pending',
      result: bet.result
    };
    
    // Using direct SQL to bypass schema mismatch issues
    const [newBet] = await db.execute(sql`
      INSERT INTO casino_bets (user_id, game_id, bet_amount, status, result)
      VALUES (${formattedBet.user_id}, ${formattedBet.game_id}, ${formattedBet.bet_amount}, ${formattedBet.status}, ${JSON.stringify(formattedBet.result)})
      RETURNING *
    `);
    
    // Transform to match the expected structure
    return {
      id: newBet.id,
      userId: newBet.user_id,
      gameId: newBet.game_id,
      betAmount: newBet.bet_amount,
      status: newBet.status,
      result: newBet.result,
      createdAt: newBet.created_at,
      settledAt: newBet.settled_at
    };
  }

  async updateBetResult(
    id: number, 
    result: { win: boolean; amount: number; details?: { [key: string]: any } },
    status: "pending" | "won" | "lost" | "canceled" | "refunded"
  ): Promise<CasinoBet | undefined> {
    // Using direct SQL to bypass schema mismatch issues
    const [updatedBet] = await db.execute(sql`
      UPDATE casino_bets
      SET 
        result = ${JSON.stringify(result)},
        status = ${status},
        settled_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    
    if (!updatedBet) {
      return undefined;
    }
    
    // Transform to match the expected structure
    return {
      id: updatedBet.id,
      userId: updatedBet.user_id,
      gameId: updatedBet.game_id,
      betAmount: updatedBet.bet_amount,
      status: updatedBet.status,
      result: updatedBet.result,
      createdAt: updatedBet.created_at,
      settledAt: updatedBet.settled_at
    };
  }

  async getUserBets(userId: number, limit: number = 10): Promise<CasinoBetWithDetails[]> {
    // Using direct SQL to bypass the bet_details column issue
    const bets = await db.execute(sql`
      SELECT 
        cb.*,
        cg.name as game_name,
        cg.game_type as game_type,
        u.id as user_id,
        u.username as username
      FROM casino_bets cb
      JOIN casino_games cg ON cb.game_id = cg.id
      JOIN users u ON cb.user_id = u.id
      WHERE cb.user_id = ${userId}
      ORDER BY cb.created_at DESC
      LIMIT ${limit}
    `);
    
    // Transform the result to match the expected structure
    return bets.map((bet: any) => ({
      id: bet.id,
      userId: bet.user_id,
      gameId: bet.game_id,
      betAmount: bet.bet_amount,
      status: bet.status,
      result: bet.result,
      createdAt: bet.created_at,
      settledAt: bet.settled_at,
      user: {
        id: bet.user_id,
        username: bet.username
      },
      game: {
        name: bet.game_name,
        type: bet.game_type
      }
    }));
  }

  async getRecentBets(limit: number = 10): Promise<CasinoBetWithDetails[]> {
    // Using direct SQL to bypass schema mismatch issues
    const bets = await db.execute(sql`
      SELECT 
        cb.*,
        cg.name as game_name,
        cg.game_type as game_type,
        u.id as user_id,
        u.username as username
      FROM casino_bets cb
      JOIN casino_games cg ON cb.game_id = cg.id
      JOIN users u ON cb.user_id = u.id
      ORDER BY cb.created_at DESC
      LIMIT ${limit}
    `);
    
    // Transform the result to match the expected structure
    return bets.map((bet: any) => ({
      id: bet.id,
      userId: bet.user_id,
      gameId: bet.game_id,
      betAmount: bet.bet_amount,
      status: bet.status,
      result: bet.result,
      createdAt: bet.created_at,
      settledAt: bet.settled_at,
      user: {
        id: bet.user_id,
        username: bet.username
      },
      game: {
        name: bet.game_name,
        type: bet.game_type
      }
    }));
  }

  async getBiggestWins(limit: number = 10): Promise<CasinoBetWithDetails[]> {
    // Using direct SQL to bypass schema mismatch issues
    const bets = await db.execute(sql`
      SELECT 
        cb.*,
        cg.name as game_name,
        cg.game_type as game_type,
        u.id as user_id,
        u.username as username
      FROM casino_bets cb
      JOIN casino_games cg ON cb.game_id = cg.id
      JOIN users u ON cb.user_id = u.id
      WHERE cb.status = 'won'
      ORDER BY (cb.result->>'amount')::int DESC
      LIMIT ${limit}
    `);
    
    // Transform the result to match the expected structure
    return bets.map((bet: any) => ({
      id: bet.id,
      userId: bet.user_id,
      gameId: bet.game_id,
      betAmount: bet.bet_amount,
      status: bet.status,
      result: bet.result,
      createdAt: bet.created_at,
      settledAt: bet.settled_at,
      user: {
        id: bet.user_id,
        username: bet.username
      },
      game: {
        name: bet.game_name,
        type: bet.game_type
      }
    }));
  }

  // Casino Stats
  async getUserGameStats(userId: number, gameId: number): Promise<CasinoStat | undefined> {
    // Using direct SQL to avoid schema mismatch issues
    const result = await db.execute(sql`
      SELECT 
        cs.*,
        cg.name as game_name,
        cg.game_type as game_type
      FROM casino_stats cs
      JOIN casino_games cg ON cs.game_id = cg.id
      WHERE cs.user_id = ${userId} AND cs.game_id = ${gameId}
    `);
    
    if (result.length === 0) {
      return undefined;
    }
    
    const stat = result[0];
    
    // Transform to match the expected structure
    return {
      id: stat.id,
      userId: stat.user_id,
      gameId: stat.game_id,
      totalBets: stat.total_bets,
      totalWagered: stat.total_wagered,
      totalWon: stat.total_won,
      totalLost: stat.total_lost,
      biggestWin: stat.biggest_win,
      biggestLoss: stat.biggest_loss,
      game: {
        name: stat.game_name,
        type: stat.game_type
      }
    };
  }

  async createUserGameStats(stats: InsertCasinoStat): Promise<CasinoStat> {
    // Using direct SQL to bypass schema mismatch issues
    const formattedStats = {
      user_id: stats.userId,
      game_id: stats.gameId,
      total_bets: stats.totalBets,
      total_wagered: stats.totalWagered,
      total_won: stats.totalWon,
      total_lost: stats.totalLost,
      biggest_win: stats.biggestWin,
      biggest_loss: stats.biggestLoss
    };
    
    const [newStats] = await db.execute(sql`
      INSERT INTO casino_stats (
        user_id, 
        game_id, 
        total_bets, 
        total_wagered, 
        total_won, 
        total_lost, 
        biggest_win, 
        biggest_loss
      )
      VALUES (
        ${formattedStats.user_id},
        ${formattedStats.game_id},
        ${formattedStats.total_bets},
        ${formattedStats.total_wagered},
        ${formattedStats.total_won},
        ${formattedStats.total_lost},
        ${formattedStats.biggest_win},
        ${formattedStats.biggest_loss}
      )
      RETURNING *
    `);
    
    // Get the game info for proper structure
    const [gameInfo] = await db.execute(sql`
      SELECT name, game_type FROM casino_games WHERE id = ${formattedStats.game_id}
    `);
    
    // Return in the expected format
    return {
      id: newStats.id,
      userId: newStats.user_id,
      gameId: newStats.game_id,
      totalBets: newStats.total_bets,
      totalWagered: newStats.total_wagered,
      totalWon: newStats.total_won,
      totalLost: newStats.total_lost,
      biggestWin: newStats.biggest_win,
      biggestLoss: newStats.biggest_loss,
      game: {
        name: gameInfo.name,
        type: gameInfo.game_type
      }
    };
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
      // Update existing stats using direct SQL
      const newTotalBets = stats.totalBets + 1;
      const newTotalWagered = stats.totalWagered + betAmount;
      const newTotalWon = stats.totalWon + (isWin ? winAmount : 0);
      const newTotalLost = stats.totalLost + (isWin ? 0 : betAmount);
      const newBiggestWin = isWin && winAmount > stats.biggestWin ? winAmount : stats.biggestWin;
      const newBiggestLoss = !isWin && betAmount > stats.biggestLoss ? betAmount : stats.biggestLoss;
      
      const [updatedStats] = await db.execute(sql`
        UPDATE casino_stats
        SET 
          total_bets = ${newTotalBets},
          total_wagered = ${newTotalWagered},
          total_won = ${newTotalWon},
          total_lost = ${newTotalLost},
          biggest_win = ${newBiggestWin},
          biggest_loss = ${newBiggestLoss}
        WHERE user_id = ${userId} AND game_id = ${gameId}
        RETURNING *
      `);
      
      // Get the game info for proper structure
      const [gameInfo] = await db.execute(sql`
        SELECT name, game_type FROM casino_games WHERE id = ${gameId}
      `);
      
      // Update the stats object
      stats = {
        id: updatedStats.id,
        userId: updatedStats.user_id,
        gameId: updatedStats.game_id,
        totalBets: updatedStats.total_bets,
        totalWagered: updatedStats.total_wagered,
        totalWon: updatedStats.total_won,
        totalLost: updatedStats.total_lost,
        biggestWin: updatedStats.biggest_win,
        biggestLoss: updatedStats.biggest_loss,
        game: {
          name: gameInfo.name,
          type: gameInfo.game_type
        }
      };
    }
    
    return stats;
  }

  async getUserStats(userId: number): Promise<CasinoStat[]> {
    // Using direct SQL to avoid schema mismatch issues
    const stats = await db.execute(sql`
      SELECT 
        cs.*,
        cg.name as game_name,
        cg.game_type as game_type
      FROM casino_stats cs
      JOIN casino_games cg ON cs.game_id = cg.id
      WHERE cs.user_id = ${userId}
    `);
    
    // Transform the result to match the expected structure
    return stats.map((stat: any) => ({
      id: stat.id,
      userId: stat.user_id,
      gameId: stat.game_id,
      totalBets: stat.total_bets,
      totalWagered: stat.total_wagered,
      totalWon: stat.total_won,
      totalLost: stat.total_lost,
      biggestWin: stat.biggest_win,
      biggestLoss: stat.biggest_loss,
      game: {
        name: stat.game_name,
        type: stat.game_type
      }
    }));
  }

  async getTopWinners(limit: number = 10): Promise<any[]> {
    // Using direct SQL to bypass schema mismatch issues
    const results = await db.execute(sql`
      SELECT 
        cs.user_id,
        u.username,
        SUM(cs.total_won) as total_won,
        SUM(cs.total_lost) as total_lost,
        SUM(cs.total_won) - SUM(cs.total_lost) as net_profit
      FROM casino_stats cs
      JOIN users u ON cs.user_id = u.id
      GROUP BY cs.user_id, u.username
      ORDER BY (SUM(cs.total_won) - SUM(cs.total_lost)) DESC
      LIMIT ${limit}
    `);
    
    // Transform to match the expected structure
    return results.map((result: any) => ({
      userId: result.user_id,
      username: result.username,
      totalWon: result.total_won,
      totalLost: result.total_lost,
      netProfit: result.net_profit
    }));
  }
}