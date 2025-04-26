import { supabaseClient } from './supabase';
import { db } from './db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Set up Row-Level Security policies for Supabase tables
 * This function should be run once during initial setup
 */
export async function setupRLSPolicies() {
  try {
    console.log('Setting up Row-Level Security policies...');

    // Create RLS policy for users table
    // Users can read all users but only update their own
    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'users',
      policy_name: 'Users read policy',
      definition: 'true',
      action: 'SELECT',
    });

    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'users',
      policy_name: 'Users update policy',
      definition: 'auth.uid() = supabase_id',
      action: 'UPDATE',
    });

    // Create RLS policy for user_status table
    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'user_status',
      policy_name: 'Status read policy',
      definition: 'true',
      action: 'SELECT',
    });

    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'user_status',
      policy_name: 'Status update policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.supabase_id = auth.uid())',
      action: 'UPDATE',
    });

    // Create RLS policy for messages
    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'messages',
      policy_name: 'Messages sender read policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = sender_id AND users.supabase_id = auth.uid())',
      action: 'SELECT',
    });

    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'messages',
      policy_name: 'Messages receiver read policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = receiver_id AND users.supabase_id = auth.uid())',
      action: 'SELECT',
    });

    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'messages',
      policy_name: 'Messages insert policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = sender_id AND users.supabase_id = auth.uid())',
      action: 'INSERT',
    });

    // Create RLS policy for friend_requests
    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'friend_requests',
      policy_name: 'Friend requests sender read policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = sender_id AND users.supabase_id = auth.uid())',
      action: 'SELECT',
    });

    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'friend_requests',
      policy_name: 'Friend requests receiver read policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = receiver_id AND users.supabase_id = auth.uid())',
      action: 'SELECT',
    });

    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'friend_requests',
      policy_name: 'Friend requests insert policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = sender_id AND users.supabase_id = auth.uid())',
      action: 'INSERT',
    });

    await supabaseClient.rpc('create_auth_policy', {
      table_name: 'friend_requests',
      policy_name: 'Friend requests update policy',
      definition: 'EXISTS (SELECT 1 FROM users WHERE users.id = receiver_id AND users.supabase_id = auth.uid())',
      action: 'UPDATE',
    });

    // Add more RLS policies as needed for other tables

    console.log('RLS policies set up successfully');
  } catch (error) {
    console.error('Error setting up RLS policies:', error);
    throw error;
  }
}

/**
 * Migrate existing data from PostgreSQL to Supabase
 * This function should be run once during initial migration
 */
export async function migrateDataToSupabase() {
  try {
    console.log('Starting data migration to Supabase...');

    // Connect to existing database
    const sourceDb = db;

    // Get all users
    const users = await sourceDb.select().from(schema.users);
    console.log(`Migrating ${users.length} users...`);

    // For each user, create a Supabase Auth account if they don't have supabaseId
    for (const user of users) {
      if (!user.supabaseId) {
        try {
          // Create Supabase Auth user
          const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email: user.email,
            password: user.password, // Note: This assumes passwords are stored in plain text, which is not recommended
            email_confirm: true, // Auto-confirm email
          });

          if (authError) {
            console.error(`Error creating Supabase Auth user for ${user.email}:`, authError);
            continue;
          }

          // Update user with Supabase ID
          await sourceDb
            .update(schema.users)
            .set({ supabaseId: authUser.user.id })
            .where(eq(schema.users.id, user.id));

          console.log(`Migrated user ${user.username} (ID: ${user.id}) to Supabase Auth ID: ${authUser.user.id}`);
        } catch (error) {
          console.error(`Error migrating user ${user.username}:`, error);
        }
      } else {
        console.log(`User ${user.username} already has Supabase ID: ${user.supabaseId}`);
      }
    }

    console.log('User migration completed');

    // No need to migrate other data as it will stay in the same database
    // The Supabase migration primarily involves linking users to Supabase Auth

    console.log('Data migration to Supabase completed successfully');
  } catch (error) {
    console.error('Error migrating data to Supabase:', error);
    throw error;
  }
}

/**
 * Run the complete Supabase migration process
 */
export async function runSupabaseMigration() {
  try {
    console.log('Starting Supabase migration process...');

    // Set up RLS policies
    await setupRLSPolicies();

    // Migrate data
    await migrateDataToSupabase();

    console.log('Supabase migration completed successfully');
  } catch (error) {
    console.error('Supabase migration failed:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runSupabaseMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}