import { db, pool } from "../db";
import { sql } from "drizzle-orm";

/**
 * This migration script addresses issues with the gang schema:
 * 1. Ensures all the necessary gang tables exist with correct columns
 * 2. Fixes column names that might be causing errors
 * 3. Creates appropriate indexes
 */
export async function fixGangSchema() {
  console.log("Starting gang schema migration...");
  
  try {
    // Begin transaction
    await db.execute(sql`BEGIN`);
    
    // Check if gangs table exists and create it if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gangs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        tag TEXT NOT NULL UNIQUE,
        description TEXT,
        logo TEXT,
        bank_balance INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        experience INTEGER NOT NULL DEFAULT 0,
        respect INTEGER NOT NULL DEFAULT 0,
        strength INTEGER NOT NULL DEFAULT 10,
        defense INTEGER NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT NOW(),
        owner_id INTEGER NOT NULL
      )
    `);
    
    // Check if gang_members table exists and create it if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gang_members (
        id SERIAL PRIMARY KEY,
        gang_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL UNIQUE,
        rank TEXT NOT NULL DEFAULT 'Member',
        contribution INTEGER NOT NULL DEFAULT 0,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    
    // Check if gang_territories table exists and create it if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gang_territories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        income INTEGER NOT NULL DEFAULT 0,
        defense_bonus INTEGER NOT NULL DEFAULT 0,
        controlled_by INTEGER REFERENCES gangs(id),
        attack_cooldown TIMESTAMP,
        image TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Check if gang_wars table exists and create it if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gang_wars (
        id SERIAL PRIMARY KEY,
        attacker_id INTEGER NOT NULL REFERENCES gangs(id),
        defender_id INTEGER NOT NULL REFERENCES gangs(id),
        territory_id INTEGER REFERENCES gang_territories(id),
        status TEXT NOT NULL DEFAULT 'pending',
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        winner_id INTEGER REFERENCES gangs(id),
        attack_strength INTEGER NOT NULL DEFAULT 0,
        defense_strength INTEGER NOT NULL DEFAULT 0
      )
    `);
    
    // Check if gang_war_participants table exists and create it if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gang_war_participants (
        id SERIAL PRIMARY KEY,
        war_id INTEGER NOT NULL REFERENCES gang_wars(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        gang_id INTEGER NOT NULL REFERENCES gangs(id),
        contribution INTEGER NOT NULL DEFAULT 0,
        side TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Check if gang_missions table exists and create it if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gang_missions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        required_members INTEGER NOT NULL DEFAULT 1,
        cash_reward INTEGER NOT NULL DEFAULT 0,
        respect_reward INTEGER NOT NULL DEFAULT 0,
        experience_reward INTEGER NOT NULL DEFAULT 0,
        duration INTEGER NOT NULL,
        cooldown INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    
    // Check if gang_mission_attempts table exists and create it if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gang_mission_attempts (
        id SERIAL PRIMARY KEY,
        gang_id INTEGER NOT NULL REFERENCES gangs(id),
        mission_id INTEGER NOT NULL REFERENCES gang_missions(id),
        status TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        next_available_at TIMESTAMP
      )
    `);
    
    // Check if users table has gang_id column and add it if not
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'gang_id'
        ) THEN
          ALTER TABLE users ADD COLUMN gang_id INTEGER;
        END IF;
      END $$;
    `);
    
    // Create index on gang_members for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_gang_members_user_id ON gang_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_gang_members_gang_id ON gang_members(gang_id);
    `);
    
    // Create seed data for territories if they don't exist
    await db.execute(sql`
      INSERT INTO gang_territories (name, description, income, defense_bonus, image)
      SELECT 
        'Downtown', 
        'The heart of the city, with high-end shops and financial district.', 
        1000, 
        10, 
        '/assets/territories/downtown.jpg'
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_territories WHERE name = 'Downtown'
      );
      
      INSERT INTO gang_territories (name, description, income, defense_bonus, image)
      SELECT 
        'Harbor District', 
        'Control of the docks means control of contraband shipments.', 
        800, 
        15, 
        '/assets/territories/harbor.jpg'
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_territories WHERE name = 'Harbor District'
      );
      
      INSERT INTO gang_territories (name, description, income, defense_bonus, image)
      SELECT 
        'Little Italy', 
        'The traditional mafia stronghold with restaurants and social clubs.', 
        750, 
        25, 
        '/assets/territories/little-italy.jpg'
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_territories WHERE name = 'Little Italy'
      );
      
      INSERT INTO gang_territories (name, description, income, defense_bonus, image)
      SELECT 
        'Red Light District', 
        'Entertainment and nightlife hub, lucrative for protection rackets.', 
        1200, 
        5, 
        '/assets/territories/red-light.jpg'
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_territories WHERE name = 'Red Light District'
      );
      
      INSERT INTO gang_territories (name, description, income, defense_bonus, image)
      SELECT 
        'Industrial Zone', 
        'Warehouses and factories perfect for illegal operations.', 
        600, 
        20, 
        '/assets/territories/industrial.jpg'
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_territories WHERE name = 'Industrial Zone'
      );
    `);
    
    // Create seed data for gang missions if they don't exist
    await db.execute(sql`
      INSERT INTO gang_missions (name, description, difficulty, required_members, cash_reward, respect_reward, experience_reward, duration, cooldown, is_active)
      SELECT 
        'Bank Heist', 
        'Rob the city bank. Requires coordination and planning.', 
        'hard', 
        3, 
        10000, 
        100, 
        500, 
        120, 
        1440, 
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_missions WHERE name = 'Bank Heist'
      );
      
      INSERT INTO gang_missions (name, description, difficulty, required_members, cash_reward, respect_reward, experience_reward, duration, cooldown, is_active)
      SELECT 
        'Protection Racket', 
        'Collect protection money from local businesses.', 
        'easy', 
        1, 
        2000, 
        20, 
        100, 
        30, 
        240, 
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_missions WHERE name = 'Protection Racket'
      );
      
      INSERT INTO gang_missions (name, description, difficulty, required_members, cash_reward, respect_reward, experience_reward, duration, cooldown, is_active)
      SELECT 
        'Drug Smuggling', 
        'Move contraband through the city without getting caught.', 
        'medium', 
        2, 
        5000, 
        50, 
        250, 
        60, 
        480, 
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_missions WHERE name = 'Drug Smuggling'
      );
      
      INSERT INTO gang_missions (name, description, difficulty, required_members, cash_reward, respect_reward, experience_reward, duration, cooldown, is_active)
      SELECT 
        'Gang War', 
        'Attack a rival gang''s hideout for territory and respect.', 
        'extreme', 
        5, 
        15000, 
        200, 
        1000, 
        180, 
        2880, 
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_missions WHERE name = 'Gang War'
      );
      
      INSERT INTO gang_missions (name, description, difficulty, required_members, cash_reward, respect_reward, experience_reward, duration, cooldown, is_active)
      SELECT 
        'Money Laundering', 
        'Clean dirty money through front businesses.', 
        'medium', 
        2, 
        4000, 
        30, 
        200, 
        90, 
        360, 
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM gang_missions WHERE name = 'Money Laundering'
      );
    `);
    
    // Commit transaction
    await db.execute(sql`COMMIT`);
    
    console.log("Gang schema migration completed successfully");
    return true;
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK`);
    console.error("Gang schema migration failed:", error);
    return false;
  }
}