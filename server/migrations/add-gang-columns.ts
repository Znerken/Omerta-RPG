import { db } from "../db";
import { sql } from "drizzle-orm";

// List of columns to add
const columnsToAdd = [
  { name: "experience", query: "ALTER TABLE gangs ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0" },
  { name: "respect", query: "ALTER TABLE gangs ADD COLUMN IF NOT EXISTS respect INTEGER DEFAULT 0" },
  { name: "strength", query: "ALTER TABLE gangs ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 10" },
  { name: "defense", query: "ALTER TABLE gangs ADD COLUMN IF NOT EXISTS defense INTEGER DEFAULT 10" }
];

async function addGangColumns() {
  try {
    console.log("Starting migration to add additional columns to gangs table...");
    
    // Add each column
    for (const column of columnsToAdd) {
      try {
        console.log(`Adding column '${column.name}'...`);
        await db.execute(sql.raw(column.query));
        console.log(`Column '${column.name}' added successfully.`);
      } catch (error) {
        // If it's already exists error, we can ignore it
        if (error.message && error.message.includes("already exists")) {
          console.log(`Column '${column.name}' already exists, skipping.`);
        } else {
          console.error(`Error adding column '${column.name}':`, error);
        }
      }
    }

    console.log("Gang table migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during migration:", error);
    return false;
  }
}

// Execute the migration
addGangColumns();