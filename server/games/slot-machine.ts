/**
 * Slot Machine Game logic
 * 
 * Rules:
 * - Slot machine has 3 reels
 * - Each reel has 5 different symbols
 * - Payouts are based on matching symbols on paylines
 * - Player can bet on 1-5 paylines
 */

export interface SlotMachineBetDetails {
  lines: number; // Number of lines being bet on (1-5)
}

export interface SlotMachineResult {
  win: boolean;
  amount: number;
  details: {
    reels: number[][];
    matchedLines: number[];
    symbols: string[];
  };
}

// Slot symbols with their values
const SLOT_SYMBOLS = [
  { name: 'cherry', value: 2, frequency: 30 },
  { name: 'lemon', value: 3, frequency: 25 },
  { name: 'orange', value: 4, frequency: 20 },
  { name: 'plum', value: 5, frequency: 15 },
  { name: 'seven', value: 10, frequency: 5 },
  { name: 'bar', value: 15, frequency: 3 },
  { name: 'diamond', value: 20, frequency: 2 }
];

// Define paylines (patterns across the 3x3 grid)
// Each number represents position on the grid (0-8)
// 0 1 2
// 3 4 5
// 6 7 8
const PAYLINES = [
  [0, 1, 2], // horizontal top
  [3, 4, 5], // horizontal middle
  [6, 7, 8], // horizontal bottom
  [0, 4, 8], // diagonal top-left to bottom-right
  [6, 4, 2]  // diagonal bottom-left to top-right
];

// Get a random symbol based on frequency weighting
function getRandomSymbol() {
  const totalFrequency = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.frequency, 0);
  let random = Math.random() * totalFrequency;
  
  for (const symbol of SLOT_SYMBOLS) {
    random -= symbol.frequency;
    if (random <= 0) {
      return symbol;
    }
  }
  
  return SLOT_SYMBOLS[0]; // Fallback
}

// Process a slot machine bet
export function processSlotMachine(betAmount: number, betDetails: SlotMachineBetDetails): SlotMachineResult {
  // Validate input
  if (!betDetails.lines || betDetails.lines < 1 || betDetails.lines > 5) {
    throw new Error('Invalid number of lines. Must be between 1 and 5.');
  }
  
  // Create 3x3 slot grid
  const grid = Array(3).fill(0).map(() => 
    Array(3).fill(0).map(() => SLOT_SYMBOLS.indexOf(getRandomSymbol()))
  );
  
  // Flatten grid to check paylines
  const flatGrid = grid.flat();
  
  // Check each active payline for matches
  const matchedLines = [];
  let totalWin = 0;
  
  for (let i = 0; i < betDetails.lines; i++) {
    if (i >= PAYLINES.length) break;
    
    const payline = PAYLINES[i];
    const symbols = payline.map(pos => flatGrid[pos]);
    
    // Check if all symbols in the payline match
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      matchedLines.push(i);
      const symbolValue = SLOT_SYMBOLS[symbols[0]].value;
      totalWin += betAmount * symbolValue / betDetails.lines;
    }
  }
  
  // Return the result
  return {
    win: totalWin > 0,
    amount: Math.floor(totalWin), // Round down to ensure house edge
    details: {
      reels: grid,
      matchedLines,
      symbols: SLOT_SYMBOLS.map(s => s.name),
    },
  };
}