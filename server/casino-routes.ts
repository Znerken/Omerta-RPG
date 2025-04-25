import { Express, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isAuthenticated, isAdmin } from './middleware/auth';
import { CasinoStorage } from './storage-casino';
import { placeBetSchema } from '../shared/schema-casino';

// Game logic helpers
import { processDiceGame } from './games/dice-game';
import { processSlotMachine } from './games/slot-machine';
import { processBlackjack } from './games/blackjack';
import { processRoulette } from './games/roulette';

const casinoStorage = new CasinoStorage();

function handleZodError(error: ZodError, res: Response): void {
  const formattedErrors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
  
  res.status(400).json({ 
    error: "Validation error", 
    details: formattedErrors 
  });
}

/**
 * Register casino routes
 */
export function registerCasinoRoutes(app: Express) {
  // Get all casino games
  app.get("/api/casino/games", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const games = await casinoStorage.getAllCasinoGames();
      res.json(games);
    } catch (error) {
      console.error("Error getting casino games:", error);
      res.status(500).json({ error: "Failed to fetch casino games" });
    }
  });

  // Get a single casino game
  app.get("/api/casino/games/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await casinoStorage.getCasinoGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error getting casino game:", error);
      res.status(500).json({ error: "Failed to fetch casino game" });
    }
  });

  // Get user's recent bets
  app.get("/api/casino/bets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const bets = await casinoStorage.getUserBets(req.user.id, limit);
      res.json(bets);
    } catch (error) {
      console.error("Error getting user bets:", error);
      res.status(500).json({ error: "Failed to fetch your bets" });
    }
  });

  // Get user's game stats
  app.get("/api/casino/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await casinoStorage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting user casino stats:", error);
      res.status(500).json({ error: "Failed to fetch your casino statistics" });
    }
  });

  // Place a bet on a specific game
  app.post("/api/casino/place-bet", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('\n=== CASINO ROUTE DEBUG ===');
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      
      // Validate input
      const validatedData = placeBetSchema.parse(req.body);
      const { gameId, betAmount, betDetails } = validatedData;
      
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));
      console.log('betDetails type:', typeof betDetails);
      console.log('betDetails validation passed:', betDetails !== null && typeof betDetails === 'object');
      
      if (betDetails && typeof betDetails === 'object') {
        console.log('betDetails keys:', Object.keys(betDetails));
      }
      
      // Check if the game exists
      const game = await casinoStorage.getCasinoGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Check if the game is active
      if (!game.isActive) {
        return res.status(400).json({ error: "This game is currently unavailable" });
      }
      
      // Check if bet amount is within limits
      if (betAmount < game.minBet || betAmount > game.maxBet) {
        return res.status(400).json({ 
          error: `Bet amount must be between ${game.minBet} and ${game.maxBet}`
        });
      }
      
      // Check if user has enough cash
      if (req.user.cash < betAmount) {
        return res.status(400).json({ error: "Insufficient funds to place this bet" });
      }

      console.log('\n==== CASINO BET PROCESSING DEBUG ====');
      console.log('Game:', game.name);
      console.log('Bet Amount:', betAmount);
      console.log('Bet Details:', JSON.stringify(betDetails, null, 2));
      
      // Create pending bet
      const bet = await casinoStorage.createBet({
        userId: req.user.id,
        gameId,
        betAmount,
        betDetails,
        status: 'pending',
      });
      
      console.log('Created Bet:', JSON.stringify(bet, null, 2));

      // Process the bet based on the game type
      let result;
      switch (game.name) {
        case 'Dice':
          console.log('Processing Dice Game...');
          result = processDiceGame(betAmount, betDetails);
          break;
        case 'Slots':
          console.log('Processing Slot Machine...');
          result = processSlotMachine(betAmount, betDetails);
          break;
        case 'Blackjack':
          console.log('Processing Blackjack...');
          result = processBlackjack(betAmount, betDetails);
          break;
        case 'Roulette':
          console.log('Processing Roulette...');
          result = processRoulette(betAmount, betDetails);
          break;
        default:
          console.log('Unknown game type:', game.name);
          return res.status(400).json({ error: "Unknown game type" });
      }
      
      console.log('Game Result:', JSON.stringify(result, null, 2));

      // Update bet with result
      const status = result.win ? 'won' : 'lost';
      const updatedBet = await casinoStorage.updateBetResult(bet.id, result, status);
      
      // Update user's cash
      const cashChange = result.win ? result.amount : -betAmount;
      req.user.cash += cashChange;
      
      // Update user game stats
      await casinoStorage.updateUserGameStats(
        req.user.id,
        gameId,
        betAmount,
        result.win ? result.amount : 0,
        result.win
      );
      
      // Return the updated bet with game details
      res.status(200).json({
        bet: updatedBet,
        cashChange,
        newBalance: req.user.cash
      });
    } catch (error) {
      console.error("Error placing bet:", error);
      
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      
      res.status(500).json({ error: "Failed to place bet" });
    }
  });

  // Admin routes
  
  // Get recent bets across all users
  app.get("/api/admin/casino/bets", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const bets = await casinoStorage.getRecentBets(limit);
      res.json(bets);
    } catch (error) {
      console.error("Error getting recent bets:", error);
      res.status(500).json({ error: "Failed to fetch recent bets" });
    }
  });
  
  // Get biggest wins
  app.get("/api/admin/casino/biggest-wins", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const wins = await casinoStorage.getBiggestWins(limit);
      res.json(wins);
    } catch (error) {
      console.error("Error getting biggest wins:", error);
      res.status(500).json({ error: "Failed to fetch biggest wins" });
    }
  });
  
  // Get top winners
  app.get("/api/admin/casino/top-winners", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const winners = await casinoStorage.getTopWinners(limit);
      res.json(winners);
    } catch (error) {
      console.error("Error getting top winners:", error);
      res.status(500).json({ error: "Failed to fetch top winners" });
    }
  });
  
  // Create a new casino game
  app.post("/api/admin/casino/games", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const game = await casinoStorage.createCasinoGame(req.body);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating casino game:", error);
      res.status(500).json({ error: "Failed to create casino game" });
    }
  });
  
  // Update a casino game
  app.patch("/api/admin/casino/games/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await casinoStorage.updateCasinoGame(gameId, req.body);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error updating casino game:", error);
      res.status(500).json({ error: "Failed to update casino game" });
    }
  });
}