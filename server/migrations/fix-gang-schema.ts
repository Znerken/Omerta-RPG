import { db } from "../db";
import { sql } from "drizzle-orm";

async function fixGangSchema() {
  try {
    console.log("Starting migration to completely fix gang schema...");
    
    // Check if gangs table has the necessary columns
    console.log("Checking gangs table structure...");
    const gangTableCheck = await db.execute(sql.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'gangs'
    `));
    
    const columns = gangTableCheck.rows.map(row => row.column_name);
    console.log("Current gang table columns:", columns);
    
    // Required columns for gangs
    const requiredColumns = [
      { name: "tag", type: "TEXT", default: null },
      { name: "level", type: "INTEGER", default: "1" },
      { name: "experience", type: "INTEGER", default: "0" },
      { name: "respect", type: "INTEGER", default: "0" },
      { name: "strength", type: "INTEGER", default: "10" },
      { name: "defense", type: "INTEGER", default: "10" }
    ];
    
    // Add missing columns
    for (const column of requiredColumns) {
      if (!columns.includes(column.name)) {
        console.log(`Adding missing column '${column.name}'...`);
        if (column.default) {
          await db.execute(sql.raw(`
            ALTER TABLE gangs 
            ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}
          `));
        } else {
          await db.execute(sql.raw(`
            ALTER TABLE gangs 
            ADD COLUMN ${column.name} ${column.type}
          `));
        }
        console.log(`Column '${column.name}' added successfully.`);
      } else {
        console.log(`Column '${column.name}' already exists.`);
      }
    }

    // Now create a simplified gang_storage_test table to troubleshoot gang creation
    console.log("Creating test gang table...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS gangs_test (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        tag TEXT,
        description TEXT,
        bank_balance INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        respect INTEGER DEFAULT 0,
        strength INTEGER DEFAULT 10,
        defense INTEGER DEFAULT 10,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `));
    
    console.log("Created gangs_test table successfully.");
    
    // Insert test data to see if it works
    console.log("Inserting test gang data...");
    try {
      await db.execute(sql.raw(`
        INSERT INTO gangs_test (name, tag, description, owner_id)
        VALUES ('Test Gang', 'TST', 'A test gang', 1)
      `));
      console.log("Test gang data inserted successfully.");
    } catch (error) {
      console.error("Error inserting test gang data:", error);
    }
    
    // Create or check gang territories table
    console.log("Checking/creating gang territories table...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS gang_territories_test (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        income INTEGER DEFAULT 100,
        defense_bonus INTEGER DEFAULT 10,
        controlled_by INTEGER,
        attack_cooldown TIMESTAMP,
        image TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `));
    
    console.log("Gang schema fix completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during gang schema fix:", error);
    return false;
  }
}

// Execute the migration
fixGangSchema();