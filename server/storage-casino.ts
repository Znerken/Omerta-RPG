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
    try {
      // Since our simplified query is working, let's use that approach directly
      const insertResult = await db.execute(sql`
        INSERT INTO casino_bets (user_id, game_id, bet_amount, status, result)
        VALUES (
          ${bet.userId}, 
          ${bet.gameId}, 
          ${bet.betAmount}, 
          'pending',
          '{}'::jsonb
        )
        RETURNING *
      `);
      
      // Check if we have valid results
      if (!Array.isArray(insertResult) || insertResult.length === 0) {
        throw new Error('Failed to create bet record - no results returned');
      }
      
      const newBet = insertResult[0];
      
      // Transform to match the expected structure
      return {
        id: newBet.id,
        userId: newBet.user_id,
        gameId: newBet.game_id,
        betAmount: newBet.bet_amount,
        status: newBet.status,
        result: newBet.result || {},
        createdAt: newBet.created_at,
        settledAt: newBet.settled_at
      };
    } catch (error) {
      console.error('Error creating bet:', error);
      throw new Error(`Failed to create bet: ${error.message}`);
    }
  }

  async updateBetResult(
    id: number, 
    result: { win: boolean; amount: number; details?: { [key: string]: any } },
    status: "pending" | "won" | "lost" | "canceled" | "refunded"
  ): Promise<CasinoBet | undefined> {
    try {
      // Using direct SQL to bypass schema mismatch issues
      const resultJson = JSON.stringify(result);
      
      const queryResult = await db.execute(sql`
        UPDATE casino_bets
        SET 
          result = ${resultJson}::jsonb,
          status = ${status},
          settled_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      
      // Check if we have valid results
      if (!Array.isArray(queryResult) || queryResult.length === 0) {
        return undefined;
      }
      
      const updatedBet = queryResult[0];
      
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
    } catch (error) {
      console.error('Error updating bet result:', error);
      return undefined;
    }
  }

  async getUserBets(userId: number, limit: number = 10): Promise<CasinoBetWithDetails[]> {
    try {
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
      
      // Ensure we have an array to work with
      const betsArray = Array.isArray(bets) ? bets : [];
      
      // Transform the result to match the expected structure
      return betsArray.map((bet: any) => ({
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
    } catch (error) {
      console.error('Error getting user bets:', error);
      return [];
    }
  }

  async getRecentBets(limit: number = 10): Promise<CasinoBetWithDetails[]> {
    try {
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
      
      // Ensure we have an array to work with
      const betsArray = Array.isArray(bets) ? bets : [];
      
      // Transform the result to match the expected structure
      return betsArray.map((bet: any) => ({
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
    } catch (error) {
      console.error('Error getting recent bets:', error);
      return [];
    }
  }

  async getBiggestWins(limit: number = 10): Promise<CasinoBetWithDetails[]> {
    try {
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
      
      // Ensure we have an array to work with
      const betsArray = Array.isArray(bets) ? bets : [];
      
      // Transform the result to match the expected structure
      return betsArray.map((bet: any) => ({
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
    } catch (error) {
      console.error('Error getting biggest wins:', error);
      return [];
    }
  }

  // Casino Stats
  async getUserGameStats(userId: number, gameId: number): Promise<CasinoStat | undefined> {
    try {
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
      
      // Ensure we have an array to work with
      const resultArray = Array.isArray(result) ? result : [];
      
      if (resultArray.length === 0) {
        return undefined;
      }
      
      const stat = resultArray[0];
      
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
    } catch (error) {
      console.error('Error getting user game stats:', error);
      return undefined;
    }
  }

  async createUserGameStats(stats: InsertCasinoStat): Promise<CasinoStat> {
    try {
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
      
      const result = await db.execute(sql`
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
      
      // Ensure we can safely access the first element
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Failed to create casino stats');
      }
      
      const newStats = result[0];
      
      // Get the game info for proper structure
      const gameResult = await db.execute(sql`
        SELECT name, game_type FROM casino_games WHERE id = ${formattedStats.game_id}
      `);
      
      // Ensure we can safely access game info
      if (!Array.isArray(gameResult) || gameResult.length === 0) {
        throw new Error('Failed to retrieve game info');
      }
      
      const gameInfo = gameResult[0];
      
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
    } catch (error) {
      console.error('Error creating user game stats:', error);
      // Return a default stats object in case of failure
      return {
        id: 0,
        userId: stats.userId,
        gameId: stats.gameId,
        totalBets: stats.totalBets,
        totalWagered: stats.totalWagered,
        totalWon: stats.totalWon,
        totalLost: stats.totalLost,
        biggestWin: stats.biggestWin,
        biggestLoss: stats.biggestLoss,
        game: {
          name: "Unknown Game",
          type: "unknown"
        }
      };
    }
  }

  async updateUserGameStats(
    userId: number, 
    gameId: number, 
    betAmount: number, 
    winAmount: number, 
    isWin: boolean
  ): Promise<CasinoStat> {
    try {
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
        
        const result = await db.execute(sql`
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
        
        // Ensure we can safely access the updated stats
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error('Failed to update casino stats');
        }
        
        const updatedStats = result[0];
        
        // Get the game info for proper structure
        const gameResult = await db.execute(sql`
          SELECT name, game_type FROM casino_games WHERE id = ${gameId}
        `);
        
        // Ensure we can safely access game info
        if (!Array.isArray(gameResult) || gameResult.length === 0) {
          throw new Error('Failed to retrieve game info');
        }
        
        const gameInfo = gameResult[0];
        
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
    } catch (error) {
      console.error('Error updating user game stats:', error);
      // Return a default stats object in case of failure
      return {
        id: 0,
        userId: userId,
        gameId: gameId,
        totalBets: 1,
        totalWagered: betAmount,
        totalWon: isWin ? winAmount : 0,
        totalLost: isWin ? 0 : betAmount,
        biggestWin: isWin ? winAmount : 0,
        biggestLoss: isWin ? 0 : betAmount,
        game: {
          name: "Unknown Game",
          type: "unknown"
        }
      };
    }
  }

  async getUserStats(userId: number): Promise<CasinoStat[]> {
    try {
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
      
      // Ensure we have an array to work with
      const statsArray = Array.isArray(stats) ? stats : [];
      
      // Transform the result to match the expected structure
      return statsArray.map((stat: any) => ({
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
    } catch (error) {
      console.error('Error getting user stats:', error);
      return [];
    }
  }

  async getTopWinners(limit: number = 10): Promise<any[]> {
    try {
      // Using direct SQL to bypass schema mismatch issues
      const queryResults = await db.execute(sql`
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
      
      // Ensure we have an array to work with
      const resultsArray = Array.isArray(queryResults) ? queryResults : [];
      
      // Transform to match the expected structure
      return resultsArray.map((result: any) => ({
        userId: result.user_id,
        username: result.username,
        totalWon: result.total_won,
        totalLost: result.total_lost,
        netProfit: result.net_profit
      }));
    } catch (error) {
      console.error('Error getting top winners:', error);
      return [];
    }
  }
}