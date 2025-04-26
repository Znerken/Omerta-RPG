import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Supabase client for admin operations
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Main migration function
 */
async function migrateToSupabase() {
  try {
    console.log('Starting Supabase migration...');
    
    // Step 1: Add required columns
    await addRequiredColumns();
    
    // Step 2: Check if Supabase API is accessible
    await testSupabaseConnection();
    
    // If we get here, all basic setup is complete
    console.log('Migration setup complete.');
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Add required columns to existing tables
 */
async function addRequiredColumns() {
  console.log('Adding required columns to existing tables...');
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Check if supabase_id column exists in users table
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'supabase_id'
    `);
    
    // Add supabase_id column if it doesn't exist
    if (checkColumn.rowCount === 0) {
      console.log('Adding supabase_id column to users table...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN supabase_id TEXT UNIQUE
      `);
      console.log('supabase_id column added to users table.');
    } else {
      console.log('supabase_id column already exists in users table.');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Required columns added successfully.');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error adding required columns:', error);
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

/**
 * Test connection to Supabase
 */
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to get the current user
    const { error } = await supabaseAdmin.auth.getUser();
    
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log('Supabase connection successful.');
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    throw error;
  }
}

/**
 * Import existing users to Supabase Auth
 * WARNING: This can potentially create many users in Supabase Auth
 * Only run this once, and preferably on a development environment first
 */
async function importUsersToSupabaseAuth() {
  console.log('Importing existing users to Supabase Auth...');
  
  try {
    // Get all users from our database
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log('No users found to import.');
      return;
    }
    
    console.log(`Found ${allUsers.length} users to import.`);
    
    // Track status
    let success = 0;
    let failed = 0;
    let skipped = 0;
    
    // Process each user
    for (const user of allUsers) {
      // Skip users already linked to Supabase
      if (user.supabaseId) {
        console.log(`User ${user.username} (ID: ${user.id}) already linked to Supabase. Skipping.`);
        skipped++;
        continue;
      }
      
      try {
        // Create user in Supabase Auth
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: 'TemporaryPassword123!', // We'll force password reset
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            username: user.username,
            game_user_id: user.id,
          },
        });
        
        if (error) {
          console.error(`Failed to create user ${user.username} in Supabase Auth:`, error);
          failed++;
          continue;
        }
        
        // Update our user with Supabase ID
        await db.update(users)
          .set({ supabaseId: data.user.id })
          .where(eq(users.id, user.id));
        
        console.log(`User ${user.username} imported to Supabase Auth with ID ${data.user.id}`);
        success++;
        
        // Sleep to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Error importing user ${user.username}:`, err);
        failed++;
      }
    }
    
    console.log(`Import complete. Success: ${success}, Failed: ${failed}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Error importing users to Supabase Auth:', error);
    throw error;
  }
}

/**
 * Sync Supabase Auth users with our database
 * This adds any users created in Supabase Auth to our database
 */
async function syncSupabaseUsers() {
  try {
    console.log('Syncing Supabase Auth users with database...');
    
    // Get all users from Supabase Auth
    const { data: { users: supabaseUsers }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    if (!supabaseUsers || supabaseUsers.length === 0) {
      console.log('No Supabase users found to sync.');
      return;
    }
    
    console.log(`Found ${supabaseUsers.length} Supabase users to sync.`);
    
    // Track status
    let created = 0;
    let linked = 0;
    let skipped = 0;
    
    // Process users
    for (const supabaseUser of supabaseUsers) {
      try {
        // Check if user already exists in our database by Supabase ID
        const existingUserById = await db.select()
          .from(users)
          .where(eq(users.supabaseId, supabaseUser.id));
        
        if (existingUserById.length > 0) {
          console.log(`User with Supabase ID ${supabaseUser.id} already exists in database. Skipping.`);
          skipped++;
          continue;
        }
        
        // Check if user exists by email
        const existingUserByEmail = await db.select()
          .from(users)
          .where(eq(users.email, supabaseUser.email || ''));
        
        if (existingUserByEmail.length > 0) {
          // Link existing user
          const user = existingUserByEmail[0];
          
          await db.update(users)
            .set({ supabaseId: supabaseUser.id })
            .where(eq(users.id, user.id));
          
          console.log(`Linked existing user ${user.username} (ID: ${user.id}) to Supabase ID ${supabaseUser.id}`);
          linked++;
          continue;
        }
        
        // Extract metadata
        const metadata = supabaseUser.user_metadata as Record<string, any> || {};
        const username = metadata.username || supabaseUser.email?.split('@')[0] || 'user' + Math.floor(Math.random() * 10000);
        
        // Create new user in our database
        const [newUser] = await db.insert(users)
          .values({
            username,
            email: supabaseUser.email || '',
            password: 'SUPABASE_AUTH', // We don't use passwords with Supabase auth
            supabaseId: supabaseUser.id,
            level: 1,
            cash: 1000,
            respect: 0,
            xp: 0,
            isAdmin: false,
            isJailed: false,
          })
          .returning();
        
        console.log(`Created new user ${username} (ID: ${newUser.id}) for Supabase ID ${supabaseUser.id}`);
        created++;
      } catch (err) {
        console.error(`Error processing Supabase user ${supabaseUser.id}:`, err);
      }
    }
    
    console.log(`Sync complete. Created: ${created}, Linked: ${linked}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Error syncing Supabase users:', error);
    throw error;
  }
}

// Run the main migration function if this script is executed directly
if (require.main === module) {
  migrateToSupabase();
}

// Export functions for use in other scripts
export {
  migrateToSupabase,
  addRequiredColumns,
  importUsersToSupabaseAuth,
  syncSupabaseUsers,
};