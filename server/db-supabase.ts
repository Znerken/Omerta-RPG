import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';
import * as economySchema from '@shared/schema-economy';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if required database environment variables exist
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create database connection
const queryClient = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Max idle time for connections in seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // We'll handle prepared statements ourselves if needed
});

// Initialize drizzle with all schemas
export const db = drizzle(queryClient, { 
  schema: { 
    ...schema, 
    ...casinoSchema,
    ...economySchema,
  }
});

/**
 * Initialize the database connection and verify it works
 * @returns true if connection is successful, false otherwise
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Try a simple query to verify the connection works
    const result = await queryClient`SELECT NOW()`;
    console.log('Database connection successful, current time:', result[0].now);
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

/**
 * Apply database migrations
 * This function should be called during server initialization
 */
export async function runMigrations(): Promise<void> {
  try {
    // This is a placeholder for actual migration code
    // In a real app, you would use something like Drizzle's migrate function
    // But for simplicity, we're just logging a message
    console.log('Database migration functionality not implemented yet');
    console.log('Use npm run db:push to apply schema changes');
  } catch (error) {
    console.error('Failed to apply migrations:', error);
    throw error;
  }
}