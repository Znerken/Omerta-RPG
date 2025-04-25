/**
 * Roulette Game logic
 * 
 * Rules:
 * - Standard European roulette wheel with numbers 0-36
 * - Various bet types: straight, split, street, corner, line, column, dozen, red/black, even/odd, low/high
 * - Payouts vary by bet type
 */

export interface RouletteBetDetails {
  betType: string;
  numbers: number[]; // Numbers the player is betting on
}

export interface RouletteResult {
  win: boolean;
  amount: number;
  details: {
    spinResult: number;
    betType: string;
    selectedNumbers: number[];
  };
}

// Roulette bet types and payouts
const BET_TYPES = {
  straight: { payout: 35 },    // Single number
  split: { payout: 17 },       // Two adjacent numbers
  street: { payout: 11 },      // Three numbers in a row
  corner: { payout: 8 },       // Four numbers in a square
  line: { payout: 5 },         // Six numbers (two adjacent rows)
  column: { payout: 2 },       // Twelve numbers (entire column)
  dozen: { payout: 2 },        // Twelve numbers (1-12, 13-24, 25-36)
  red: { payout: 1 },          // Red numbers
  black: { payout: 1 },        // Black numbers
  even: { payout: 1 },         // Even numbers
  odd: { payout: 1 },          // Odd numbers
  low: { payout: 1 },          // Numbers 1-18
  high: { payout: 1 }          // Numbers 19-36
};

// Red numbers on a standard roulette wheel
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Process a roulette bet
export function processRoulette(betAmount: number, betDetails: RouletteBetDetails): RouletteResult {
  // Validate bet details
  if (!betDetails.betType || !betDetails.numbers) {
    throw new Error('Invalid bet details');
  }
  
  const betType = betDetails.betType.toLowerCase();
  
  if (!BET_TYPES[betType]) {
    throw new Error(`Unknown bet type: ${betType}`);
  }
  
  // Generate a random number for the roulette wheel (0-36)
  const spinResult = Math.floor(Math.random() * 37);
  
  // Determine if the bet is a winner
  let win = false;
  
  switch (betType) {
    case 'straight':
      win = betDetails.numbers.includes(spinResult);
      break;
    case 'split':
    case 'street':
    case 'corner':
    case 'line':
      win = betDetails.numbers.includes(spinResult);
      break;
    case 'column':
      win = betDetails.numbers.includes(spinResult);
      break;
    case 'dozen':
      win = betDetails.numbers.includes(spinResult);
      break;
    case 'red':
      win = RED_NUMBERS.includes(spinResult);
      break;
    case 'black':
      win = spinResult !== 0 && !RED_NUMBERS.includes(spinResult);
      break;
    case 'even':
      win = spinResult !== 0 && spinResult % 2 === 0;
      break;
    case 'odd':
      win = spinResult !== 0 && spinResult % 2 === 1;
      break;
    case 'low':
      win = spinResult >= 1 && spinResult <= 18;
      break;
    case 'high':
      win = spinResult >= 19 && spinResult <= 36;
      break;
  }
  
  // Calculate payout
  const payout = win ? betAmount * (BET_TYPES[betType].payout + 1) : 0;
  
  return {
    win,
    amount: payout,
    details: {
      spinResult,
      betType,
      selectedNumbers: betDetails.numbers,
    },
  };
}