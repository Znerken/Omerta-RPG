import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import ws from 'ws';

// Load environment variables
dotenv.config();

// Configure WebSocket for Neon database
neonConfig.webSocketConstructor = ws;

// Check if database URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema: { ...schema, ...casinoSchema } });

/**
 * Initialize database connection
 * @returns True if successful, false if failed
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Check connection by executing a simple query
    const [{ now }] = await db.execute<{ now: Date }>(sql`SELECT NOW()`);
    console.log(`Database connection established at ${now.toISOString()}`);
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

/**
 * Create tables if they don't exist
 * This uses Drizzle's schema to create tables
 */
export async function createTables(): Promise<void> {
  try {
    // This is a placeholder for Drizzle migrations
    // For production, use proper migration scripts
    console.log('Tables already managed by migrations');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

/**
 * Synchronize Supabase Auth users with our database
 * This function fetches all users from Supabase Auth and ensures
 * they exist in our database.
 */
export async function syncSupabaseUsers(): Promise<void> {
  try {
    // This function would be implemented when integrating with Supabase Auth
    // It would:
    // 1. Fetch all users from Supabase Auth
    // 2. Compare with users in our database
    // 3. Create missing users in our database
    // 4. Update existing users if needed
    console.log('Supabase user sync not implemented yet');
  } catch (error) {
    console.error('Error syncing Supabase users:', error);
    throw error;
  }
}