/**
 * Dice Game logic
 * 
 * Rules:
 * - User predicts the outcome of a dice roll
 * - User can bet higher, lower, or exact
 * - For "higher", the roll must be higher than the target number
 * - For "lower", the roll must be lower than the target number
 * - For "exact", the roll must be exactly the target number
 * - Payouts: 
 *   - Higher/Lower: 1.8x (accounting for house edge)
 *   - Exact: 5x (higher payout for higher difficulty)
 */

export interface DiceBetDetails {
  prediction: 'higher' | 'lower' | 'exact';
  targetNumber: number;
}

export interface DiceResult {
  win: boolean;
  amount: number;
  details: {
    diceRoll: number;
    prediction: string;
    targetNumber: number;
  };
}

/**
 * Process a dice game bet and determine the outcome
 */
export function processDiceGame(betAmount: number, betDetails: DiceBetDetails): DiceResult {
  // Validate inputs
  if (!betDetails.prediction || !betDetails.targetNumber) {
    throw new Error('Invalid bet details');
  }
  
  if (betDetails.targetNumber < 1 || betDetails.targetNumber > 6) {
    throw new Error('Target number must be between 1 and 6');
  }
  
  // Generate random dice roll (1-6)
  const diceRoll = Math.floor(Math.random() * 6) + 1;
  
  // Determine if the player won
  let win = false;
  let winAmount = 0;
  
  switch (betDetails.prediction) {
    case 'higher':
      win = diceRoll > betDetails.targetNumber;
      winAmount = Math.floor(betAmount * 1.8); // 80% profit (accounting for house edge)
      break;
    case 'lower':
      win = diceRoll < betDetails.targetNumber;
      winAmount = Math.floor(betAmount * 1.8);
      break;
    case 'exact':
      win = diceRoll === betDetails.targetNumber;
      winAmount = betAmount * 5; // 5x payout for exact match
      break;
    default:
      throw new Error('Invalid prediction type');
  }
  
  return {
    win,
    amount: win ? winAmount : 0,
    details: {
      diceRoll,
      prediction: betDetails.prediction,
      targetNumber: betDetails.targetNumber,
    },
  };
}