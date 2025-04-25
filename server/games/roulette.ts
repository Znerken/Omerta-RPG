/**
 * Roulette game logic
 * 
 * European roulette with a single zero (0-36).
 * Players can bet on specific numbers, colors, or groups of numbers.
 */

type RouletteBetType = 
  'straight' | 'split' | 'street' | 'corner' | 'line' | 
  'column' | 'dozen' | 'red' | 'black' | 'even' | 'odd' | 
  'low' | 'high';

type RouletteBetDetails = {
  betType: RouletteBetType;
  numbers: number[]; // Numbers covered by the bet
};

type RouletteResult = {
  win: boolean;
  amount: number;
  details: {
    number: number;
    color: 'red' | 'black' | 'green';
    betType: RouletteBetType;
    selectedNumbers: number[];
    payout: number;
  };
};

// Define number colors
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// Payout ratios for different bet types
const PAYOUTS: Record<RouletteBetType, number> = {
  straight: 35, // Single number (1:35)
  split: 17,     // Two adjacent numbers (1:17)
  street: 11,    // Three numbers in a row (1:11)
  corner: 8,     // Four adjacent numbers forming a square (1:8)
  line: 5,       // Six numbers from two adjacent rows (1:5)
  column: 2,     // 12 numbers in a column (1:2)
  dozen: 2,      // 12 numbers (1-12, 13-24, 25-36) (1:2)
  red: 1,        // 18 red numbers (1:1)
  black: 1,      // 18 black numbers (1:1)
  even: 1,       // 18 even numbers (1:1)
  odd: 1,        // 18 odd numbers (1:1)
  low: 1,        // Numbers 1-18 (1:1)
  high: 1,       // Numbers 19-36 (1:1)
};

export function processRoulette(
  betDetails: any, 
  betAmount: number
): RouletteResult {
  // Validate bet details
  const details = betDetails as RouletteBetDetails;
  if (!details.betType || !details.numbers || !details.numbers.length) {
    throw new Error("Invalid bet details");
  }
  
  // Spin the wheel (0-36)
  const number = Math.floor(Math.random() * 37);
  
  // Determine the color of the number
  let color: 'red' | 'black' | 'green';
  if (number === 0) {
    color = 'green';
  } else if (RED_NUMBERS.includes(number)) {
    color = 'red';
  } else {
    color = 'black';
  }
  
  // Check if the bet wins
  let win = false;
  
  switch (details.betType) {
    case 'straight':
    case 'split':
    case 'street':
    case 'corner':
    case 'line':
      // These bet types win if the landed number is in the selected numbers
      win = details.numbers.includes(number);
      break;
    
    case 'column':
    case 'dozen':
      // These bet types win if the landed number is in the selected numbers
      // and the number is not 0
      win = number !== 0 && details.numbers.includes(number);
      break;
    
    case 'red':
      win = color === 'red';
      break;
    
    case 'black':
      win = color === 'black';
      break;
    
    case 'even':
      win = number !== 0 && number % 2 === 0;
      break;
    
    case 'odd':
      win = number !== 0 && number % 2 === 1;
      break;
    
    case 'low':
      win = number >= 1 && number <= 18;
      break;
    
    case 'high':
      win = number >= 19 && number <= 36;
      break;
    
    default:
      throw new Error("Invalid bet type");
  }
  
  // Calculate payout
  const payout = PAYOUTS[details.betType];
  const winAmount = win ? betAmount * payout : 0;
  
  return {
    win,
    amount: winAmount,
    details: {
      number,
      color,
      betType: details.betType,
      selectedNumbers: details.numbers,
      payout
    }
  };
}