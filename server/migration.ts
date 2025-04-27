/**
 * This script handles the migration from PostgreSQL to Supabase.
 * It will:
 * 1. Add the supabaseId column to the users table if it doesn't exist
 * 2. Link existing users to Supabase users by email
 * 3. Create Supabase users for existing users
 * 4. Update schema to include last_seen and status fields
 */

import { db } from './db-supabase';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { createSupabaseUser, supabaseAdmin, getSupabaseUser } from './supabase';

// Load environment variables
dotenv.config();

// Main migration function
async function migrate() {
  try {
    console.log('Starting migration process...');

    // 1. Add necessary columns if they don't exist
    console.log('Step 1: Adding necessary columns...');
    await addColumns();

    // 2. Link existing users to Supabase users
    console.log('Step 2: Linking existing users to Supabase users...');
    await linkUsers();

    // 3. Update user status for existing users
    console.log('Step 3: Updating user status for existing users...');
    await updateUserStatus();

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Add necessary columns to the users table
async function addColumns() {
  try {
    // Add supabaseId column
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
    console.log('Added supabase_id column if needed');

    // Add lastSeen column
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'last_seen'
        ) THEN
          ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT now();
        END IF;
      END $$;
    `);
    console.log('Added last_seen column if needed');

    // Add status column
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
    console.log('Added status column if needed');
  } catch (error) {
    console.error('Error adding columns:', error);
    throw error;
  }
}

// Link existing users to Supabase users
async function linkUsers() {
  try {
    // Get all users without a Supabase ID
    const usersWithoutSupabaseId = await db
      .select()
      .from(users)
      .where(sql`supabase_id IS NULL`);

    console.log(`Found ${usersWithoutSupabaseId.length} users to link`);

    // Get existing Supabase users
    const { data: { users: supabaseUsers }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Failed to get Supabase users: ${error.message}`);
    }
    
    console.log(`Found ${supabaseUsers.length} Supabase users`);
    
    // Create a map of emails to Supabase users for quick lookup
    const supabaseUsersByEmail = new Map();
    for (const user of supabaseUsers) {
      if (user.email) {
        supabaseUsersByEmail.set(user.email.toLowerCase(), user);
      }
    }
    
    // Process each user
    for (const user of usersWithoutSupabaseId) {
      // Skip users without an email
      if (!user.email) {
        console.log(`Skipping user ${user.username} (ID: ${user.id}) - no email`);
        continue;
      }
      
      // Check if a Supabase user with the same email exists
      const supabaseUser = supabaseUsersByEmail.get(user.email.toLowerCase());
      
      if (supabaseUser) {
        // Link to existing Supabase user
        await db
          .update(users)
          .set({ supabaseId: supabaseUser.id })
          .where(eq(users.id, user.id));
        
        console.log(`Linked user ${user.username} (ID: ${user.id}) to existing Supabase user ${supabaseUser.id}`);
      } else {
        // Create new Supabase user with a random secure password
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
        
        try {
          const newSupabaseUser = await createSupabaseUser(
            user.email,
            randomPassword,
            { username: user.username }
          );
          
          if (newSupabaseUser) {
            // Link to new Supabase user
            await db
              .update(users)
              .set({ supabaseId: newSupabaseUser.id })
              .where(eq(users.id, user.id));
            
            console.log(`Created and linked Supabase user for ${user.username} (ID: ${user.id})`);
          } else {
            console.error(`Failed to create Supabase user for ${user.username} (ID: ${user.id})`);
          }
        } catch (error) {
          console.error(`Error creating Supabase user for ${user.username} (ID: ${user.id}):`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error linking users:', error);
    throw error;
  }
}

// Update user status for existing users
async function updateUserStatus() {
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to update status`);
    
    // Update all users to have lastSeen and status
    for (const user of allUsers) {
      // Skip users that already have a status
      if (user.status) {
        continue;
      }
      
      await db
        .update(users)
        .set({
          status: 'offline',
          lastSeen: new Date()
        })
        .where(eq(users.id, user.id));
    }
    
    console.log('Updated user status for all users');
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

// Run the migration
migrate()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });