/**
 * Blackjack Game logic
 * 
 * Rules:
 * - Standard blackjack rules (aim for 21 without going over)
 * - Player vs dealer
 * - Dealer must hit on 16 or less, stand on 17 or more
 * - Blackjack pays 3:2
 * - Basic actions: hit, stand, double down
 */

export interface BlackjackBetDetails {
  action: 'bet' | 'hit' | 'stand' | 'double' | 'split';
  hand?: string; // JSON string of current hand if continuing a game
  dealerHand?: string; // JSON string of dealer's hand if continuing a game
  playerCards?: string[]; // Array of card strings (e.g. ['A♥', 'K♠'])
  dealerCards?: string[]; // Array of card strings (e.g. ['7♦', '10♣'])
  playerScore?: number;
  dealerScore?: number;
  result?: 'win' | 'lose' | 'push';
}

export interface BlackjackResult {
  win: boolean;
  amount: number;
  details: {
    playerHand: Card[];
    dealerHand: Card[];
    playerValue: number;
    dealerValue: number;
    gameState: 'active' | 'player_bust' | 'dealer_bust' | 'player_win' | 'dealer_win' | 'push';
    canHit: boolean;
    canStand: boolean;
    canDouble: boolean;
    message: string;
  };
}

interface Card {
  suit: string;
  value: string;
  numericValue: number;
}

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Generate a shuffled deck
function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (const value of VALUES) {
      let numericValue: number;
      
      if (value === 'A') {
        numericValue = 11; // Ace can be 1 or 11
      } else if (['J', 'Q', 'K'].includes(value)) {
        numericValue = 10;
      } else {
        numericValue = parseInt(value);
      }
      
      deck.push({ suit, value, numericValue });
    }
  }
  
  // Shuffle the deck using Fisher-Yates algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

// Calculate the value of a blackjack hand, accounting for aces
function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (card.value === 'A') {
      aces++;
    }
    value += card.numericValue;
  }
  
  // Adjust for aces if needed
  while (value > 21 && aces > 0) {
    value -= 10; // Convert one ace from 11 to 1
    aces--;
  }
  
  return value;
}

// Process a new blackjack game
function startNewGame(): { playerHand: Card[], dealerHand: Card[], deck: Card[] } {
  const deck = createDeck();
  const playerHand: Card[] = [deck.pop()!, deck.pop()!];
  const dealerHand: Card[] = [deck.pop()!, deck.pop()!];
  
  return { playerHand, dealerHand, deck };
}

// Process dealer's turn
function playDealerHand(dealerHand: Card[], deck: Card[]): Card[] {
  while (calculateHandValue(dealerHand) < 17) {
    dealerHand.push(deck.pop()!);
  }
  return dealerHand;
}

// Determine the game result
function determineResult(playerHand: Card[], dealerHand: Card[]): { 
  win: boolean, 
  gameState: 'active' | 'player_bust' | 'dealer_bust' | 'player_win' | 'dealer_win' | 'push',
  message: string 
} {
  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);
  
  if (playerValue > 21) {
    return { win: false, gameState: 'player_bust', message: 'Bust! You went over 21.' };
  }
  
  if (dealerValue > 21) {
    return { win: true, gameState: 'dealer_bust', message: 'Dealer busts! You win.' };
  }
  
  if (playerValue > dealerValue) {
    return { win: true, gameState: 'player_win', message: 'You win!' };
  } else if (playerValue < dealerValue) {
    return { win: false, gameState: 'dealer_win', message: 'Dealer wins.' };
  } else {
    return { win: false, gameState: 'push', message: 'Push - it\'s a tie.' };
  }
}

// Check for blackjack
function hasBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateHandValue(hand) === 21;
}

// Process a blackjack bet
export function processBlackjack(betAmount: number, betDetails: BlackjackBetDetails): BlackjackResult {
  let playerHand: Card[] = [];
  let dealerHand: Card[] = [];
  let deck: Card[] = [];
  let gameState: 'active' | 'player_bust' | 'dealer_bust' | 'player_win' | 'dealer_win' | 'push' = 'active';
  let win = false;
  let message = '';
  let multiplier = 1;
  
  // Start a new game or continue an existing one
  if (betDetails.action === 'bet') {
    const newGame = startNewGame();
    playerHand = newGame.playerHand;
    dealerHand = newGame.dealerHand;
    deck = newGame.deck;
    
    // Check for blackjack
    if (hasBlackjack(playerHand)) {
      if (hasBlackjack(dealerHand)) {
        gameState = 'push';
        message = 'Both have blackjack! Push.';
        win = false;
      } else {
        gameState = 'player_win';
        message = 'Blackjack! You win.';
        win = true;
        multiplier = 2.5; // Blackjack pays 3:2
      }
    } else if (hasBlackjack(dealerHand)) {
      gameState = 'dealer_win';
      message = 'Dealer has blackjack. You lose.';
      win = false;
    }
  } else {
    // Continue existing game
    try {
      // For continued game actions like hit/stand, handle playerCards and dealerCards
      if (betDetails.playerCards && betDetails.dealerCards) {
        // Convert array of card strings like "J♠" to Card objects
        playerHand = betDetails.playerCards.map(cardStr => {
          const suit = cardStr.slice(-1) === '♥' ? 'hearts' : 
                      cardStr.slice(-1) === '♦' ? 'diamonds' : 
                      cardStr.slice(-1) === '♣' ? 'clubs' : 'spades';
          const value = cardStr.slice(0, -1);
          let numericValue: number;
          
          if (value === 'A') {
            numericValue = 11;
          } else if (['J', 'Q', 'K'].includes(value)) {
            numericValue = 10;
          } else {
            numericValue = parseInt(value);
          }
          
          return { suit, value, numericValue };
        });
        
        dealerHand = betDetails.dealerCards.map(cardStr => {
          const suit = cardStr.slice(-1) === '♥' ? 'hearts' : 
                      cardStr.slice(-1) === '♦' ? 'diamonds' : 
                      cardStr.slice(-1) === '♣' ? 'clubs' : 'spades';
          const value = cardStr.slice(0, -1);
          let numericValue: number;
          
          if (value === 'A') {
            numericValue = 11;
          } else if (['J', 'Q', 'K'].includes(value)) {
            numericValue = 10;
          } else {
            numericValue = parseInt(value);
          }
          
          return { suit, value, numericValue };
        });
      }
      // If we have string format (legacy support), try parsing
      else if (betDetails.hand && betDetails.dealerHand) {
        try {
          playerHand = JSON.parse(betDetails.hand);
          dealerHand = JSON.parse(betDetails.dealerHand);
        } catch (error) {
          console.error("Failed to parse hand JSON:", error);
          throw new Error('Invalid game state format');
        }
      } else {
        throw new Error('Missing game state for continuation');
      }
      
      deck = createDeck(); // Create a new deck for continuing actions
      
      // Remove cards that are already in play to avoid duplicates
      const usedCards = new Set([
        ...playerHand.map(card => `${card.value}${card.suit}`),
        ...dealerHand.map(card => `${card.value}${card.suit}`)
      ]);
      
      deck = deck.filter(card => !usedCards.has(`${card.value}${card.suit}`));
      
      switch (betDetails.action) {
        case 'hit':
          playerHand.push(deck.pop()!);
          if (calculateHandValue(playerHand) > 21) {
            gameState = 'player_bust';
            message = 'Bust! You went over 21.';
            win = false;
          }
          break;
          
        case 'stand':
          dealerHand = playDealerHand(dealerHand, deck);
          const result = determineResult(playerHand, dealerHand);
          gameState = result.gameState;
          message = result.message;
          win = result.win;
          break;
          
        case 'double':
          // Double the bet, take exactly one card, then stand
          playerHand.push(deck.pop()!);
          multiplier = 2;
          
          if (calculateHandValue(playerHand) > 21) {
            gameState = 'player_bust';
            message = 'Bust! You went over 21.';
            win = false;
          } else {
            dealerHand = playDealerHand(dealerHand, deck);
            const result = determineResult(playerHand, dealerHand);
            gameState = result.gameState;
            message = result.message;
            win = result.win;
          }
          break;
      }
    } catch (error) {
      console.error("Blackjack game error:", error);
      throw new Error('Invalid game state');
    }
  }
  
  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);
  
  // Determine available actions
  const canHit = gameState === 'active' && playerValue < 21;
  const canStand = gameState === 'active';
  const canDouble = gameState === 'active' && playerHand.length === 2;
  
  return {
    win,
    amount: win ? betAmount * multiplier : gameState === 'push' ? betAmount : 0,
    details: {
      playerHand,
      dealerHand,
      playerValue,
      dealerValue,
      gameState,
      canHit,
      canStand,
      canDouble,
      message
    }
  };
}