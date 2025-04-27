import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * This is a compatibility function for storage-gang.ts to use
 * which ensures the gang schema is correctly set up
 */
export async function fixGangSchema(): Promise<boolean> {
  try {
    console.log("Checking gang schema and fixing if needed...");
    
    // Check if gangs table exists
    const tableCheck = await db.execute(sql.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gangs'
      )
    `));
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log("Gangs table does not exist, creating...");
      await db.execute(sql.raw(`
        CREATE TABLE gangs (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          tag TEXT NOT NULL UNIQUE,
          description TEXT,
          logo TEXT,
          bank_balance INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          experience INTEGER DEFAULT 0,
          respect INTEGER DEFAULT 0, 
          strength INTEGER DEFAULT 10,
          defense INTEGER DEFAULT 10,
          owner_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `));
      console.log("Gangs table created.");
    } else {
      console.log("Gangs table already exists, checking columns...");
      
      // Check columns
      const columnsCheck = await db.execute(sql.raw(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'gangs'
      `));
      
      const columns = columnsCheck.rows.map(row => row.column_name);
      console.log("Current columns:", columns);
      
      // Add any missing columns
      if (!columns.includes('tag')) {
        console.log("Adding tag column...");
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN tag TEXT UNIQUE
        `));
      }
      
      if (!columns.includes('logo')) {
        console.log("Adding logo column...");
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN logo TEXT
        `));
      }
      
      if (!columns.includes('level')) {
        console.log("Adding level column...");
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN level INTEGER DEFAULT 1
        `));
      }
      
      if (!columns.includes('experience')) {
        console.log("Adding experience column...");
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN experience INTEGER DEFAULT 0
        `));
      }
      
      if (!columns.includes('respect')) {
        console.log("Adding respect column...");
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN respect INTEGER DEFAULT 0
        `));
      }
      
      if (!columns.includes('strength')) {
        console.log("Adding strength column...");
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN strength INTEGER DEFAULT 10
        `));
      }
      
      if (!columns.includes('defense')) {
        console.log("Adding defense column...");
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN defense INTEGER DEFAULT 10
        `));
      }
      
      console.log("Gang schema check completed.");
    }
    
    // Check if gang_members table exists
    const membersTableCheck = await db.execute(sql.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gang_members'
      )
    `));
    
    const membersTableExists = membersTableCheck.rows[0].exists;
    
    if (!membersTableExists) {
      console.log("Gang members table does not exist, creating...");
      await db.execute(sql.raw(`
        CREATE TABLE gang_members (
          id SERIAL PRIMARY KEY,
          gang_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          rank TEXT DEFAULT 'Soldier',
          contribution INTEGER DEFAULT 0,
          joined_at TIMESTAMP DEFAULT NOW()
        )
      `));
      console.log("Gang members table created.");
    }
    
    return true;
  } catch (error) {
    console.error("Error fixing gang schema:", error);
    return false;
  }
}