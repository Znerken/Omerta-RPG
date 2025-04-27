import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { pool, db } from './db-supabase';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';
import * as economySchema from '@shared/schema-economy';

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    // Drop all tables
    console.log('Dropping all tables...');
    await db.execute(sql`
      DO $$ 
      DECLARE 
        r RECORD; 
      BEGIN 
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
        LOOP 
          EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE'; 
        END LOOP; 
      END $$;
    `);
    
    console.log('All tables dropped successfully.');

    // Recreate tables
    console.log('Recreating tables from schema...');
    
    // Create each table separately to avoid reference issues
    
    // User Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "supabase_id" TEXT UNIQUE,
        "level" INTEGER NOT NULL DEFAULT 1,
        "xp" INTEGER NOT NULL DEFAULT 0,
        "cash" INTEGER NOT NULL DEFAULT 1000,
        "respect" INTEGER NOT NULL DEFAULT 0,
        "avatar" TEXT,
        "banner_image" TEXT,
        "bio" TEXT,
        "html_profile" TEXT,
        "profile_theme" TEXT,
        "show_achievements" BOOLEAN DEFAULT TRUE,
        "is_admin" BOOLEAN NOT NULL DEFAULT FALSE,
        "is_jailed" BOOLEAN NOT NULL DEFAULT FALSE,
        "jail_time_end" TIMESTAMP,
        "jail_reason" TEXT,
        "ban_expiry" TIMESTAMP,
        "ban_reason" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_stats" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users"("id"),
        "strength" INTEGER NOT NULL DEFAULT 10,
        "intelligence" INTEGER NOT NULL DEFAULT 10,
        "charisma" INTEGER NOT NULL DEFAULT 10,
        "endurance" INTEGER NOT NULL DEFAULT 10,
        "stealth" INTEGER NOT NULL DEFAULT 10,
        "luck" INTEGER NOT NULL DEFAULT 10,
        "crimes_committed" INTEGER NOT NULL DEFAULT 0,
        "successful_crimes" INTEGER NOT NULL DEFAULT 0,
        "failed_crimes" INTEGER NOT NULL DEFAULT 0,
        "crimes_caught" INTEGER NOT NULL DEFAULT 0,
        "money_earned" INTEGER NOT NULL DEFAULT 0,
        "money_spent" INTEGER NOT NULL DEFAULT 0,
        "times_jailed" INTEGER NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_status" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users"("id"),
        "status" TEXT NOT NULL DEFAULT 'offline',
        "last_active" TIMESTAMP DEFAULT NOW(),
        "last_location" TEXT
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_friends" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "friend_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "status" TEXT NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE("user_id", "friend_id")
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" SERIAL PRIMARY KEY,
        "sender_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "recipient_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "content" TEXT NOT NULL,
        "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
        "sent_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "gangs" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "leader_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "respect" INTEGER NOT NULL DEFAULT 0,
        "money" INTEGER NOT NULL DEFAULT 0,
        "level" INTEGER NOT NULL DEFAULT 1,
        "territory" INTEGER NOT NULL DEFAULT 0,
        "color" TEXT,
        "image" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "gang_members" (
        "id" SERIAL PRIMARY KEY,
        "gang_id" INTEGER NOT NULL REFERENCES "gangs"("id"),
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") UNIQUE,
        "role" TEXT NOT NULL DEFAULT 'member',
        "joined_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Drug System Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drugs" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "base_price" INTEGER NOT NULL,
        "risk_level" INTEGER NOT NULL DEFAULT 1,
        "addiction_rate" INTEGER NOT NULL DEFAULT 0,
        "strength_bonus" INTEGER DEFAULT 0,
        "stealth_bonus" INTEGER DEFAULT 0,
        "charisma_bonus" INTEGER DEFAULT 0,
        "intelligence_bonus" INTEGER DEFAULT 0,
        "cash_gain_bonus" INTEGER DEFAULT 0,
        "duration_hours" INTEGER NOT NULL,
        "side_effects" TEXT,
        "image" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drug_ingredients" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "price" INTEGER NOT NULL,
        "rarity" INTEGER NOT NULL DEFAULT 1,
        "image" TEXT
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drug_recipes" (
        "id" SERIAL PRIMARY KEY,
        "drug_id" INTEGER NOT NULL REFERENCES "drugs"("id"),
        "ingredient_id" INTEGER NOT NULL REFERENCES "drug_ingredients"("id"),
        "quantity" INTEGER NOT NULL DEFAULT 1
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_drugs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "drug_id" INTEGER NOT NULL REFERENCES "drugs"("id"),
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "acquired_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_ingredients" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "ingredient_id" INTEGER NOT NULL REFERENCES "drug_ingredients"("id"),
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "acquired_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drug_labs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "name" TEXT NOT NULL,
        "level" INTEGER NOT NULL DEFAULT 1,
        "security_level" INTEGER NOT NULL DEFAULT 1,
        "capacity" INTEGER NOT NULL DEFAULT 10,
        "cost_to_upgrade" INTEGER NOT NULL,
        "location" TEXT NOT NULL,
        "discovery_chance" INTEGER NOT NULL DEFAULT 5,
        "risk_modifier" INTEGER DEFAULT 0,
        "production_modifier" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "last_raided_at" TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drug_production" (
        "id" SERIAL PRIMARY KEY,
        "lab_id" INTEGER NOT NULL REFERENCES "drug_labs"("id"),
        "drug_id" INTEGER NOT NULL REFERENCES "drugs"("id"),
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "started_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "completes_at" TIMESTAMP NOT NULL,
        "is_completed" BOOLEAN NOT NULL DEFAULT FALSE,
        "success_rate" INTEGER NOT NULL DEFAULT 90
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drug_deals" (
        "id" SERIAL PRIMARY KEY,
        "seller_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "buyer_id" INTEGER REFERENCES "users"("id"),
        "drug_id" INTEGER NOT NULL REFERENCES "drugs"("id"),
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "price_per_unit" INTEGER NOT NULL,
        "total_price" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "is_public" BOOLEAN NOT NULL DEFAULT FALSE,
        "risk_level" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "completed_at" TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drug_addictions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "drug_id" INTEGER NOT NULL REFERENCES "drugs"("id"),
        "level" INTEGER NOT NULL DEFAULT 1,
        "withdrawal_effect" TEXT NOT NULL,
        "last_dosage" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drug_territories" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "controlled_by" INTEGER REFERENCES "gangs"("id"),
        "profit_modifier" INTEGER NOT NULL DEFAULT 100,
        "risk_modifier" INTEGER NOT NULL DEFAULT 100,
        "reputation_required" INTEGER NOT NULL DEFAULT 0,
        "image" TEXT
      );
    `);
    
    // Add any remaining tables from economy and casino schemas
    console.log('Core tables created successfully.');
    
    console.log('Database reset completed successfully.');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the reset
resetDatabase()
  .then(() => console.log('Database reset script completed.'))
  .catch(err => {
    console.error('Failed to reset database:', err);
    process.exit(1);
  });