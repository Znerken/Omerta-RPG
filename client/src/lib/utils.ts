import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Format a countdown time in MM:SS format
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate time remaining in seconds
 */
export function getTimeRemaining(endTime: Date): number {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Calculate success chance for activities based on stats and weights
 */
export function calculateSuccessChance(
  stats: {
    strength: number;
    stealth: number;
    charisma: number;
    intelligence: number;
  },
  weights: {
    strength: number;
    stealth: number;
    charisma: number;
    intelligence: number;
  },
  baseDifficulty: number = 50
): number {
  // Calculate weighted score
  const totalWeight = weights.strength + weights.stealth + weights.charisma + weights.intelligence;
  
  const weightedScore = 
    (stats.strength * weights.strength + 
    stats.stealth * weights.stealth + 
    stats.charisma * weights.charisma + 
    stats.intelligence * weights.intelligence) / totalWeight;
  
  // Convert to percentage, capped between 10% and 95%
  const successChance = Math.min(95, Math.max(10, Math.round(weightedScore - baseDifficulty + 50)));
  
  return successChance;
}

/**
 * Calculate level progress percentage
 */
export function calculateLevelProgress(currentXp: number, nextLevelXp: number): number {
  return Math.min(100, Math.round((currentXp / nextLevelXp) * 100));
}

/**
 * Calculate required XP for level
 */
export function calculateRequiredXP(level: number): number {
  return 100 * Math.pow(level, 2);
}

/**
 * Format a date in a human-readable way
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
}