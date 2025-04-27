import dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle, sql } from 'drizzle-orm/neon-serverless';
import { createClient } from '@supabase/supabase-js';
import * as schema from '../shared/schema';
import * as casinoSchema from '../shared/schema-casino';
import * as economySchema from '../shared/schema-economy';

// Load environment variables
dotenv.config();

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle client
const db = drizzle(pool, { schema: { ...schema, ...casinoSchema, ...economySchema } });

// Create Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
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
  console.log('Starting PostgreSQL to Supabase migration...');
  
  try {
    // 1. Check database connection
    console.log('Checking database connection...');
    const result = await db.execute<{ now: Date }>(sql\`SELECT NOW()\`);
    console.log(`Database connected at ${result.rows[0].now}`);
    
    // 2. Add missing columns if needed
    console.log('Checking for missing columns...');
    await addMissingColumns();
    
    // 3. Migrate users to Supabase Auth
    console.log('Migrating users to Supabase Auth...');
    await migrateUsers();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Add missing columns to support Supabase integration
 */
async function addMissingColumns() {
  // Check if supabase_id column exists in users table
  const hasSupabaseIdColumn = await checkColumnExists('users', 'supabase_id');
  
  if (!hasSupabaseIdColumn) {
    console.log('Adding supabase_id column to users table...');
    await pool.query(
      'ALTER TABLE users ADD COLUMN supabase_id TEXT'
    );
    console.log('Added supabase_id column to users table');
  } else {
    console.log('supabase_id column already exists in users table');
  }
  
  // Check if status column exists in users table
  const hasStatusColumn = await checkColumnExists('users', 'status');
  
  if (!hasStatusColumn) {
    console.log('Adding status column to users table...');
    await pool.query(
      "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'offline'"
    );
    console.log('Added status column to users table');
  } else {
    console.log('status column already exists in users table');
  }
  
  // Check if last_seen column exists in users table
  const hasLastSeenColumn = await checkColumnExists('users', 'last_seen');
  
  if (!hasLastSeenColumn) {
    console.log('Adding last_seen column to users table...');
    await pool.query(
      'ALTER TABLE users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    );
    console.log('Added last_seen column to users table');
  } else {
    console.log('last_seen column already exists in users table');
  }
}

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await pool.query(
    \`SELECT column_name 
     FROM information_schema.columns 
     WHERE table_name = $1 AND column_name = $2\`,
    [tableName, columnName]
  );
  
  return result.rows.length > 0;
}

/**
 * Migrate existing users to Supabase Auth and link them
 */
async function migrateUsers() {
  // Get all users without Supabase ID
  const result = await pool.query(
    'SELECT * FROM users WHERE supabase_id IS NULL'
  );
  
  const usersToMigrate = result.rows;
  console.log(`Found ${usersToMigrate.length} users to migrate to Supabase`);
  
  const temporaryPassword = 'TemporaryPassword123!';
  let successCount = 0;
  let failureCount = 0;
  
  for (const user of usersToMigrate) {
    try {
      console.log(`Migrating user: ${user.username} (ID: ${user.id})`);
      
      // Create a Supabase user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          game_user_id: user.id
        }
      });
      
      if (authError) {
        console.error(`Error creating Supabase user: ${authError.message}`);
        failureCount++;
        continue;
      }
      
      console.log(`Created Supabase user: ${authUser.user.email} (ID: ${authUser.user.id})`);
      
      // Update user in database with Supabase ID
      await pool.query(
        'UPDATE users SET supabase_id = $1 WHERE id = $2',
        [authUser.user.id, user.id]
      );
      
      console.log(`Updated user "${user.username}" with Supabase ID: ${authUser.user.id}`);
      successCount++;
    } catch (error) {
      console.error(`Error migrating user ${user.username}:`, error);
      failureCount++;
    }
  }
  
  console.log(`Migration summary: ${successCount} succeeded, ${failureCount} failed`);
}

// Run the migration
migrate().catch(console.error);