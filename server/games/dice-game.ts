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
  console.log('=== DICE GAME DEBUG INFO ===');
  console.log('Received bet amount:', betAmount);
  console.log('Received bet details:', JSON.stringify(betDetails, null, 2));
  console.log('Bet details type:', typeof betDetails);
  
  // Additional validation to help diagnose the issue
  if (!betDetails) {
    console.log('betDetails is null or undefined');
    throw new Error('Missing bet details');
  }
  
  if (typeof betDetails !== 'object') {
    console.log('betDetails is not an object:', betDetails);
    throw new Error('Bet details is not an object');
  }
  
  // Validate required fields
  if (!betDetails.prediction) {
    console.log('Missing prediction in bet details');
    throw new Error('Missing prediction in bet details');
  }
  
  if (betDetails.targetNumber === undefined || betDetails.targetNumber === null) {
    console.log('Missing target number in bet details');
    throw new Error('Missing target number in bet details');
  }
  
  // Validate prediction value
  if (!['higher', 'lower', 'exact'].includes(betDetails.prediction)) {
    console.log('Invalid prediction type:', betDetails.prediction);
    throw new Error(`Invalid prediction type: ${betDetails.prediction}`);
  }
  
  // Validate target number range
  if (betDetails.targetNumber < 1 || betDetails.targetNumber > 6) {
    console.log('Target number out of range:', betDetails.targetNumber);
    throw new Error('Target number must be between 1 and 6');
  }
  
  console.log('Validation passed successfully');
  console.log('=== END DICE GAME DEBUG INFO ===');
  
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