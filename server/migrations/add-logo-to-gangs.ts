import { db } from "../db";
import { sql } from "drizzle-orm";

async function addLogoToGangs() {
  try {
    console.log("Starting migration to add logo column to gangs table...");
    
    // Check if logo column already exists
    const columnCheck = await db.execute(sql.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'gangs' AND column_name = 'logo'
    `));
    
    if (columnCheck.rows.length === 0) {
      console.log("Adding logo column to gangs table...");
      await db.execute(sql.raw(`
        ALTER TABLE gangs ADD COLUMN logo TEXT
      `));
      console.log("Logo column added successfully.");
    } else {
      console.log("Logo column already exists, skipping.");
    }
    
    console.log("Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during migration:", error);
    return false;
  }
}

// Execute the migration
addLogoToGangs();