/**
 * Dice game logic
 * 
 * The player predicts whether a dice roll (1-6) will be 
 * higher or lower than a certain number, or equal to a specific value.
 */

type DiceBetDetails = {
  prediction: 'higher' | 'lower' | 'exact'; // Higher, lower, or exact match
  targetNumber: number; // The number to compare against (2-12 for two dice)
};

type DiceResult = {
  win: boolean;
  amount: number;
  details: {
    diceValue: number;
    prediction: string;
    targetNumber: number;
    success: boolean;
  };
};

export function processDiceGame(
  betDetails: any, 
  betAmount: number
): DiceResult {
  // Validate the bet details
  const details = betDetails as DiceBetDetails;
  if (!details.prediction || !details.targetNumber) {
    throw new Error("Invalid bet details");
  }

  // Roll the dice (1-6)
  const diceValue = Math.floor(Math.random() * 6) + 1;
  
  // Determine if the prediction is correct
  let success = false;
  let multiplier = 1;
  
  switch (details.prediction) {
    case 'higher':
      success = diceValue > details.targetNumber;
      // The multiplier depends on the probability of success
      // Lower target numbers have higher probability of rolling higher
      multiplier = 6 / (6 - details.targetNumber);
      break;
    
    case 'lower':
      success = diceValue < details.targetNumber;
      // Higher target numbers have higher probability of rolling lower
      multiplier = 6 / (details.targetNumber - 1);
      break;
    
    case 'exact':
      success = diceValue === details.targetNumber;
      // Exact matches have 1/6 probability
      multiplier = 5;
      break;
    
    default:
      throw new Error("Invalid prediction type");
  }
  
  // Calculate the amount won (0 if lost)
  const winAmount = success ? Math.floor(betAmount * multiplier) : 0;
  
  return {
    win: success,
    amount: winAmount,
    details: {
      diceValue,
      prediction: details.prediction,
      targetNumber: details.targetNumber,
      success
    }
  };
}