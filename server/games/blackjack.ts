/**
 * Blackjack game logic
 * 
 * Standard blackjack game where the player tries to beat the dealer
 * by getting a hand value as close to 21 as possible without going over.
 */

type Card = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string; // '2' through '10', 'J', 'Q', 'K', 'A'
  numericValue: number; // 2-11
};

type BlackjackBetDetails = {
  action: 'bet' | 'hit' | 'stand' | 'double' | 'split';
  handId?: string; // For games in progress
};

type BlackjackResult = {
  win: boolean;
  amount: number;
  details: {
    playerHands: Card[][];
    dealerHand: Card[];
    playerHandValues: number[];
    dealerHandValue: number;
    blackjack: boolean;
    bust: boolean;
    gameComplete: boolean;
    outcome: string;
  };
};

// Create a deck of cards
function createDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const value of values) {
      let numericValue: number;
      
      if (value === 'A') {
        numericValue = 11; // Aces can be 1 or 11
      } else if (['J', 'Q', 'K'].includes(value)) {
        numericValue = 10; // Face cards are all worth 10
      } else {
        numericValue = parseInt(value);
      }
      
      deck.push({ suit, value, numericValue });
    }
  }
  
  return shuffle(deck);
}

// Shuffle the deck
function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate the value of a hand, considering aces
function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    value += card.numericValue;
    if (card.value === 'A') {
      aces++;
    }
  }
  
  // Adjust for aces if the hand is busting
  while (value > 21 && aces > 0) {
    value -= 10; // Convert an ace from 11 to 1
    aces--;
  }
  
  return value;
}

// Determine winner of a hand
function determineWinner(playerHandValue: number, dealerHandValue: number): 'player' | 'dealer' | 'push' {
  if (playerHandValue > 21) {
    return 'dealer'; // Player busts
  } else if (dealerHandValue > 21) {
    return 'player'; // Dealer busts
  } else if (playerHandValue > dealerHandValue) {
    return 'player'; // Player has higher hand
  } else if (dealerHandValue > playerHandValue) {
    return 'dealer'; // Dealer has higher hand
  } else {
    return 'push'; // It's a tie
  }
}

export function processBlackjack(
  betDetails: any, 
  betAmount: number
): BlackjackResult {
  // Validate bet details
  const details = betDetails as BlackjackBetDetails;
  
  // Create and shuffle deck
  const deck = createDeck();
  
  // Initial deal
  const playerHand: Card[] = [deck.pop()!, deck.pop()!];
  const dealerHand: Card[] = [deck.pop()!, deck.pop()!];
  
  // Calculate initial hand values
  let playerHandValue = calculateHandValue(playerHand);
  let dealerHandValue = calculateHandValue(dealerHand);
  
  // Check for blackjack
  const playerBlackjack = playerHandValue === 21;
  const dealerBlackjack = dealerHandValue === 21;
  
  // Player natural blackjack pays 3:2
  if (playerBlackjack) {
    // If both have blackjack, it's a push
    if (dealerBlackjack) {
      return {
        win: false,
        amount: betAmount, // Return the original bet (push)
        details: {
          playerHands: [playerHand],
          dealerHand,
          playerHandValues: [playerHandValue],
          dealerHandValue,
          blackjack: true,
          bust: false,
          gameComplete: true,
          outcome: 'push'
        }
      };
    } else {
      // Player wins with blackjack
      return {
        win: true,
        amount: Math.floor(betAmount * 2.5), // Blackjack pays 3:2
        details: {
          playerHands: [playerHand],
          dealerHand,
          playerHandValues: [playerHandValue],
          dealerHandValue,
          blackjack: true,
          bust: false,
          gameComplete: true,
          outcome: 'blackjack'
        }
      };
    }
  } else if (dealerBlackjack) {
    // Dealer wins with blackjack
    return {
      win: false,
      amount: 0,
      details: {
        playerHands: [playerHand],
        dealerHand,
        playerHandValues: [playerHandValue],
        dealerHandValue,
        blackjack: false,
        bust: false,
        gameComplete: true,
        outcome: 'dealer blackjack'
      }
    };
  }
  
  // Player's turn
  // If action is 'hit', give player another card
  if (details.action === 'hit') {
    playerHand.push(deck.pop()!);
    playerHandValue = calculateHandValue(playerHand);
  }
  
  // If player busts, dealer wins
  if (playerHandValue > 21) {
    return {
      win: false,
      amount: 0,
      details: {
        playerHands: [playerHand],
        dealerHand,
        playerHandValues: [playerHandValue],
        dealerHandValue,
        blackjack: false,
        bust: true,
        gameComplete: true,
        outcome: 'bust'
      }
    };
  }
  
  // Dealer's turn (dealer hits on 16 or less, stands on 17 or more)
  while (dealerHandValue < 17) {
    dealerHand.push(deck.pop()!);
    dealerHandValue = calculateHandValue(dealerHand);
  }
  
  // Determine winner
  const winner = determineWinner(playerHandValue, dealerHandValue);
  
  switch (winner) {
    case 'player':
      return {
        win: true,
        amount: betAmount * 2, // Win pays 1:1
        details: {
          playerHands: [playerHand],
          dealerHand,
          playerHandValues: [playerHandValue],
          dealerHandValue,
          blackjack: false,
          bust: false,
          gameComplete: true,
          outcome: 'win'
        }
      };
    
    case 'dealer':
      return {
        win: false,
        amount: 0,
        details: {
          playerHands: [playerHand],
          dealerHand,
          playerHandValues: [playerHandValue],
          dealerHandValue,
          blackjack: false,
          bust: false,
          gameComplete: true,
          outcome: 'lose'
        }
      };
    
    case 'push':
      return {
        win: false,
        amount: betAmount, // Return the original bet
        details: {
          playerHands: [playerHand],
          dealerHand,
          playerHandValues: [playerHandValue],
          dealerHandValue,
          blackjack: false,
          bust: false,
          gameComplete: true,
          outcome: 'push'
        }
      };
    
    default:
      throw new Error("Invalid game state");
  }
}