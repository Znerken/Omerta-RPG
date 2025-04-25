/**
 * Slot machine game logic
 * 
 * Classic slot machine with three reels. Each reel can show different symbols,
 * and payouts depend on which symbols line up on the pay line.
 */

type SlotBetDetails = {
  lines: number; // Number of pay lines to bet on (1-5)
};

type SlotSymbol = {
  id: string;
  name: string;
  value: number;
};

type SlotResult = {
  win: boolean;
  amount: number;
  details: {
    reels: string[][];
    payLines: {
      symbols: string[];
      win: boolean;
      amount: number;
    }[];
    totalWin: number;
  };
};

// Define slot symbols and their payouts
const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: "cherry", name: "Cherry", value: 2 },
  { id: "lemon", name: "Lemon", value: 3 },
  { id: "orange", name: "Orange", value: 5 },
  { id: "plum", name: "Plum", value: 10 },
  { id: "bell", name: "Bell", value: 15 },
  { id: "seven", name: "Seven", value: 25 },
  { id: "diamond", name: "Diamond", value: 50 },
];

// Pay line definitions (for a 3x3 slot machine)
const PAY_LINES = [
  [[0, 0], [0, 1], [0, 2]], // Top row
  [[1, 0], [1, 1], [1, 2]], // Middle row
  [[2, 0], [2, 1], [2, 2]], // Bottom row
  [[0, 0], [1, 1], [2, 2]], // Diagonal top-left to bottom-right
  [[2, 0], [1, 1], [0, 2]], // Diagonal bottom-left to top-right
];

export function processSlotMachine(
  betDetails: any, 
  betAmount: number
): SlotResult {
  // Validate bet details
  const details = betDetails as SlotBetDetails;
  const lines = Math.min(Math.max(1, details.lines || 1), 5);
  
  // Calculate bet per line
  const betPerLine = Math.floor(betAmount / lines);
  
  // Generate random reels (3x3 grid)
  const reels: string[][] = [[], [], []];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const randomIndex = Math.floor(Math.random() * SLOT_SYMBOLS.length);
      reels[i].push(SLOT_SYMBOLS[randomIndex].id);
    }
  }
  
  // Check pay lines
  const payLineResults = [];
  let totalWin = 0;
  
  for (let i = 0; i < lines; i++) {
    const payLine = PAY_LINES[i];
    const symbols = payLine.map(([row, col]) => reels[row][col]);
    
    // Check for winning combinations
    let payLineWin = false;
    let payLineAmount = 0;
    
    // Three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      const symbolValue = SLOT_SYMBOLS.find(s => s.id === symbols[0])?.value || 0;
      payLineWin = true;
      payLineAmount = betPerLine * symbolValue;
    }
    // Two of the same symbol (partial win)
    else if (symbols[0] === symbols[1] || symbols[1] === symbols[2]) {
      const matchingSymbol = symbols[0] === symbols[1] ? symbols[0] : symbols[1];
      const symbolValue = SLOT_SYMBOLS.find(s => s.id === matchingSymbol)?.value || 0;
      payLineWin = true;
      payLineAmount = Math.floor(betPerLine * (symbolValue / 5)); // Partial payout
    }
    
    totalWin += payLineAmount;
    
    payLineResults.push({
      symbols,
      win: payLineWin,
      amount: payLineAmount
    });
  }
  
  return {
    win: totalWin > 0,
    amount: totalWin,
    details: {
      reels,
      payLines: payLineResults,
      totalWin
    }
  };
}