import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';
import dotenv from 'dotenv';
import ws from 'ws';
import { supabaseAdmin, listUsers } from './supabase';

// Load environment variables
dotenv.config();

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Validate database connection string
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle instance
export const db = drizzle(pool, { schema: { ...schema, ...casinoSchema } });

/**
 * Initialize database connection
 * @returns True if successful, false if failed
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Test connection
    const [{ now }] = await db.execute<{ now: Date }>(sql`SELECT NOW()`);
    console.log(`Database connected successfully at ${now.toISOString()}`);
    
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
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
    // This is just a placeholder. In a real application, you would use Drizzle's
    // migration tools to manage schema changes.
    console.log('Tables should be created using Drizzle migrations');
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
    console.log('Synchronizing Supabase users with database...');
    
    // Get all users from Supabase Auth
    const supabaseUsers = await listUsers();
    if (!supabaseUsers || supabaseUsers.length === 0) {
      console.log('No users found in Supabase Auth');
      return;
    }
    
    console.log(`Found ${supabaseUsers.length} users in Supabase Auth`);
    
    // For each Supabase user
    for (const supabaseUser of supabaseUsers) {
      // Skip if no ID or email
      if (!supabaseUser.id || !supabaseUser.email) {
        console.log('Skipping user with no ID or email');
        continue;
      }
      
      // Check if user already exists in our database
      const existingUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.supabaseId, supabaseUser.id));
      
      if (existingUsers.length > 0) {
        console.log(`User ${supabaseUser.email} already exists in database`);
        continue;
      }
      
      // Get username from metadata or use email as fallback
      const username = supabaseUser.user_metadata?.username || 
                       supabaseUser.email.split('@')[0];
      
      // Create user in our database
      await db.insert(schema.users).values({
        username,
        email: supabaseUser.email,
        password: 'supabase-managed', // Password is managed by Supabase
        supabaseId: supabaseUser.id,
        level: 1,
        experience: 0,
        cash: 1000,
        respect: 0,
        profileTheme: 'dark',
        createdAt: new Date(),
        lastSeen: new Date(),
        status: 'offline',
      });
      
      console.log(`Created user ${username} in database`);
    }
    
    console.log('Supabase user synchronization complete');
  } catch (error) {
    console.error('Error synchronizing Supabase users:', error);
    throw error;
  }
}