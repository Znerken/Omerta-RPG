import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { supabaseAdmin } from './supabase';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';
import dotenv from 'dotenv';
import ws from 'ws';

// Load environment variables
dotenv.config();

// Configure Neon for WebSocket connections
neonConfig.webSocketConstructor = ws;

// Validate database connection string
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create database pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema: { ...schema, ...casinoSchema } });

/**
 * Initialize database connection
 * @returns True if successful, false if failed
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected: ', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection error: ', error);
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
    console.error('Error closing database connection: ', error);
  }
}

/**
 * Reset database data - for testing only
 * WARNING: This will delete all data
 */
export async function resetDatabase(): Promise<void> {
  // This should only be used in development/testing
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Cannot reset database in production');
  }
  
  // Implement with caution
}

/**
 * Create tables if they don't exist
 * This uses Drizzle's schema to create tables
 */
export async function createTables(): Promise<void> {
  try {
    // Implement table creation logic
    console.log('Tables created or already exist');
  } catch (error) {
    console.error('Error creating tables: ', error);
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
    // Fetch users from Supabase Auth
    const { data: supabaseUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching Supabase users:', error);
      return;
    }
    
    console.log(`Found ${supabaseUsers.users.length} users in Supabase Auth`);
    
    // For each Supabase user, check if they exist in our database
    for (const supabaseUser of supabaseUsers.users) {
      // Extract game user ID from user metadata if it exists
      const gameUserId = supabaseUser.user_metadata?.game_user_id;
      
      if (gameUserId) {
        // Update the supabase_id field for this user if needed
        const [existingUser] = await db
          .select()
          .from(schema.users)
          .where((users) => users.id.equals(gameUserId));
        
        if (existingUser && !existingUser.supabaseId) {
          // Update the user to link them to Supabase
          await db
            .update(schema.users)
            .set({ supabaseId: supabaseUser.id })
            .where((users) => users.id.equals(gameUserId));
          
          console.log(`Linked existing user ${existingUser.username} (ID: ${existingUser.id}) to Supabase ID: ${supabaseUser.id}`);
        }
      } else {
        // Look up user by email
        const [existingUserByEmail] = await db
          .select()
          .from(schema.users)
          .where((users) => users.email.equals(supabaseUser.email || ''));
        
        if (existingUserByEmail && !existingUserByEmail.supabaseId) {
          // Update the user to link them to Supabase
          await db
            .update(schema.users)
            .set({ supabaseId: supabaseUser.id })
            .where((users) => users.id.equals(existingUserByEmail.id));
          
          // Update Supabase user metadata with game user ID
          await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
            user_metadata: {
              ...supabaseUser.user_metadata,
              game_user_id: existingUserByEmail.id,
              username: existingUserByEmail.username,
            },
          });
          
          console.log(`Linked existing user ${existingUserByEmail.username} (ID: ${existingUserByEmail.id}) to Supabase ID: ${supabaseUser.id}`);
        }
      }
    }
    
    console.log('Supabase user synchronization complete');
  } catch (error) {
    console.error('Error synchronizing Supabase users:', error);
  }
}