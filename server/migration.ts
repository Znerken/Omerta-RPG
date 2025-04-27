import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { sql } from 'drizzle-orm';
import { initializeDatabase, createTables, syncSupabaseUsers, db, closeDatabase } from './db-supabase';
import { createSupabaseUser } from './supabase';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Create source database pool
const sourcePool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Migration script for PostgreSQL to Supabase
 * This script performs the following steps:
 * 1. Initialize the database connection
 * 2. Create necessary tables if they don't exist
 * 3. Add any missing columns required for Supabase integration
 * 4. Migrate existing users to Supabase Auth
 * 5. Link existing users to their Supabase IDs
 */
async function migrate() {
  try {
    console.log('Starting migration to Supabase...');

    // Step 1: Initialize database
    const initialized = await initializeDatabase();
    if (!initialized) {
      throw new Error('Failed to initialize database connection');
    }

    // Step 2: Create tables if they don't exist
    await createTables();

    // Step 3: Add any missing columns required for Supabase
    await addMissingColumns();

    // Step 4 & 5: Migrate users to Supabase and link them
    await migrateUsers();

    // Close database connection
    await closeDatabase();

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Add missing columns to support Supabase integration
 */
async function addMissingColumns() {
  try {
    console.log('Adding missing columns for Supabase integration...');

    // Check if status column exists in users table
    const statusColumnExists = await checkColumnExists('users', 'status');
    if (!statusColumnExists) {
      console.log('Adding status column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline'
      `);
    }

    // Check if last_seen column exists in users table
    const lastSeenColumnExists = await checkColumnExists('users', 'last_seen');
    if (!lastSeenColumnExists) {
      console.log('Adding last_seen column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW()
      `);
    }

    // Check if supabase_id column exists in users table
    const supabaseIdColumnExists = await checkColumnExists('users', 'supabase_id');
    if (!supabaseIdColumnExists) {
      console.log('Adding supabase_id column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS supabase_id TEXT
      `);
    }

    console.log('All required columns exist');
  } catch (error) {
    console.error('Error adding missing columns:', error);
    throw error;
  }
}

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND column_name = ${columnName}
      );
    `);
    
    return result.rows[0]?.exists;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Migrate existing users to Supabase Auth and link them
 */
async function migrateUsers() {
  try {
    console.log('Migrating users to Supabase Auth...');

    // Get all users without a Supabase ID
    const usersToMigrate = await db.query.users.findMany({
      where: eq(users.supabaseId, null),
    });

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    // Process each user
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        console.log(`Migrating user: ${user.username} (${user.email})`);

        // Create a temporary password for the user
        // This is OK since they will need to use "Forgot Password" to set a new one
        const tempPassword = `Temp${Math.random().toString(36).substring(2, 10)}!`;
        
        // Create user in Supabase Auth
        const supabaseUser = await createSupabaseUser(
          user.email,
          tempPassword,
          {
            username: user.username,
            game_user_id: user.id,
          }
        );

        if (!supabaseUser) {
          console.error(`Failed to create Supabase user for ${user.username}`);
          errorCount++;
          continue;
        }

        // Update user record with Supabase ID
        await db
          .update(users)
          .set({ 
            supabaseId: supabaseUser.id,
            status: user.status || 'offline',
            lastSeen: new Date() 
          })
          .where(eq(users.id, user.id));

        console.log(`Successfully migrated user ${user.username} to Supabase Auth`);
        successCount++;
      } catch (error) {
        console.error(`Error migrating user ${user.username}:`, error);
        errorCount++;
      }
    }

    // Sync any users that were created directly in Supabase Auth
    await syncSupabaseUsers();

    console.log(`
      Migration results:
      - Total users processed: ${usersToMigrate.length}
      - Successfully migrated: ${successCount}
      - Failed migrations: ${errorCount}
    `);
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
}

// Run the migration
migrate().catch(console.error);