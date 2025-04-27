import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';
import * as economySchema from '@shared/schema-economy';
import dotenv from 'dotenv';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { eq, inArray, sql } from 'drizzle-orm';
import { supabaseAdmin } from './supabase';

// Load environment variables
dotenv.config();

// Configure neon for WebSocket usage
neonConfig.webSocketConstructor = ws as any;

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create database pool and client
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema: { ...schema, ...casinoSchema, ...economySchema } });

/**
 * Initialize database connection and verify it works
 * @returns True if database connection is successful, false otherwise
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Try a simple query to verify connection
    const [{ now }] = await db.execute<{ now: Date }>(sql`SELECT NOW()`);
    console.log(`Database connection successful at ${now.toISOString()}`);
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
 * This uses the schema defined in shared/schema.ts
 */
export async function createTables(): Promise<void> {
  try {
    console.log('Creating database tables if needed...');
    
    // Add supabaseId column to users table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'supabase_id'
          ) THEN
              ALTER TABLE users ADD COLUMN supabase_id TEXT;
          END IF;
      END $$;
    `);

    // Add lastSeen column to users table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'last_seen'
          ) THEN
              ALTER TABLE users ADD COLUMN last_seen TIMESTAMP;
          END IF;
      END $$;
    `);

    // Add status column to users table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'status'
          ) THEN
              ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'offline';
          END IF;
      END $$;
    `);
    
    console.log('Database tables created or updated');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

/**
 * Synchronize users from Supabase Auth to our game database
 */
export async function syncSupabaseUsers(): Promise<void> {
  try {
    console.log('Synchronizing users from Supabase Auth...');
    
    // Get all users from Supabase Auth
    const { data: supabaseUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching Supabase users:', error.message);
      return;
    }
    
    if (!supabaseUsers || supabaseUsers.users.length === 0) {
      console.log('No users found in Supabase Auth');
      return;
    }
    
    console.log(`Found ${supabaseUsers.users.length} users in Supabase Auth`);
    
    // Process each user
    for (const supabaseUser of supabaseUsers.users) {
      // Check if user exists in our database
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.supabaseId, supabaseUser.id)
      });
      
      if (existingUser) {
        // User exists, update the lastSeen field
        await db
          .update(schema.users)
          .set({
            email: supabaseUser.email,
            lastSeen: new Date()
          })
          .where(eq(schema.users.supabaseId, supabaseUser.id));
      } else {
        // Check if user exists by email
        const userByEmail = await db.query.users.findFirst({
          where: eq(schema.users.email, supabaseUser.email || '')
        });
        
        if (userByEmail) {
          // User exists by email, link them to Supabase
          await db
            .update(schema.users)
            .set({
              supabaseId: supabaseUser.id,
              lastSeen: new Date()
            })
            .where(eq(schema.users.id, userByEmail.id));
            
          console.log(`Linked existing user ${userByEmail.username} to Supabase ID ${supabaseUser.id}`);
        } else {
          // Get username from metadata
          const username = supabaseUser.user_metadata?.username || 
                         supabaseUser.email?.split('@')[0] || 
                         `user_${Math.random().toString(36).substring(2, 10)}`;
          
          // Create new user
          await db.insert(schema.users).values({
            username,
            email: supabaseUser.email || '',
            supabaseId: supabaseUser.id,
            // Default values
            password: 'SUPABASE_AUTH', // Placeholder, since auth is handled by Supabase
            level: 1,
            cash: 1000,
            respect: 0,
            createdAt: new Date(),
            lastSeen: new Date(),
            isAdmin: false,
            isJailed: false,
            isBanned: false,
            status: 'offline'
          });
          
          console.log(`Created new user ${username} with Supabase ID ${supabaseUser.id}`);
        }
      }
    }
    
    console.log('User synchronization completed');
  } catch (error) {
    console.error('Error synchronizing users:', error);
    throw error;
  }
}