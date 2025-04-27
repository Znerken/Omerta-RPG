import { db } from "../db";
import { sql } from "drizzle-orm";

async function createGangTables() {
  try {
    console.log("Starting migration to create gang-related tables...");
    
    // Create territories table
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS gang_territories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          income INTEGER DEFAULT 100,
          defense_bonus INTEGER DEFAULT 10,
          controlled_by INTEGER REFERENCES gangs(id),
          attack_cooldown TIMESTAMP,
          image TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `));
      console.log("Gang territories table created or already exists.");
    } catch (error) {
      console.error("Error creating gang territories table:", error);
    }
    
    // Create gang missions table
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS gang_missions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          difficulty TEXT NOT NULL,
          duration INTEGER NOT NULL,
          cooldown INTEGER NOT NULL,
          required_members INTEGER DEFAULT 1,
          cash_reward INTEGER NOT NULL,
          experience_reward INTEGER NOT NULL,
          respect_reward INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `));
      console.log("Gang missions table created or already exists.");
    } catch (error) {
      console.error("Error creating gang missions table:", error);
    }
    
    // Create gang mission attempts table
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS gang_mission_attempts (
          id SERIAL PRIMARY KEY,
          gang_id INTEGER NOT NULL REFERENCES gangs(id),
          mission_id INTEGER NOT NULL REFERENCES gang_missions(id),
          status TEXT DEFAULT 'in_progress',
          started_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP,
          next_available_at TIMESTAMP
        )
      `));
      console.log("Gang mission attempts table created or already exists.");
    } catch (error) {
      console.error("Error creating gang mission attempts table:", error);
    }
    
    // Create gang wars table
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS gang_wars (
          id SERIAL PRIMARY KEY,
          attacker_id INTEGER NOT NULL REFERENCES gangs(id),
          defender_id INTEGER NOT NULL REFERENCES gangs(id),
          territory_id INTEGER REFERENCES gang_territories(id),
          status TEXT DEFAULT 'active',
          start_time TIMESTAMP DEFAULT NOW(),
          end_time TIMESTAMP,
          winner_id INTEGER REFERENCES gangs(id),
          attack_strength INTEGER DEFAULT 0,
          defense_strength INTEGER DEFAULT 0
        )
      `));
      console.log("Gang wars table created or already exists.");
    } catch (error) {
      console.error("Error creating gang wars table:", error);
    }
    
    // Create gang war participants table
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS gang_war_participants (
          id SERIAL PRIMARY KEY,
          war_id INTEGER NOT NULL REFERENCES gang_wars(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          gang_id INTEGER NOT NULL REFERENCES gangs(id),
          side TEXT NOT NULL,
          contribution INTEGER DEFAULT 0,
          joined_at TIMESTAMP DEFAULT NOW()
        )
      `));
      console.log("Gang war participants table created or already exists.");
    } catch (error) {
      console.error("Error creating gang war participants table:", error);
    }

    console.log("Gang tables migration completed!");
    return true;
  } catch (error) {
    console.error("Error during migration:", error);
    return false;
  }
}

// Execute the migration
createGangTables();