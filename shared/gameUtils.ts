/**
 * Calculate required XP for the next level
 * Uses a simple formula: 100 * level^2
 */
export function calculateRequiredXP(level: number): number {
  return 100 * Math.pow(level, 2);
}

/**
 * Format currency value to display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Format a countdown time in MM:SS format
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate time remaining in seconds
 */
export function getTimeRemaining(endTime: Date): number {
  const now = new Date();
  const diffMs = endTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Calculate success chance for a crime based on user stats and crime weights
 */
export function calculateCrimeSuccessChance(
  userStrength: number,
  userStealth: number, 
  userCharisma: number, 
  userIntelligence: number,
  crimeStrengthWeight: number,
  crimeStealthWeight: number,
  crimeCharismaWeight: number,
  crimeIntelligenceWeight: number
): number {
  const strengthFactor = (userStrength / 100) * crimeStrengthWeight;
  const stealthFactor = (userStealth / 100) * crimeStealthWeight;
  const charismaFactor = (userCharisma / 100) * crimeCharismaWeight;
  const intelligenceFactor = (userIntelligence / 100) * crimeIntelligenceWeight;
  
  return Math.min(
    95, // Cap at 95%
    Math.round((strengthFactor + stealthFactor + charismaFactor + intelligenceFactor) * 100)
  );
}
