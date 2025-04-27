import { db } from "../db";
import { sql } from "drizzle-orm";

async function addTagColumnToGangs() {
  try {
    console.log("Starting migration to add tag column to gangs table...");
    
    // Check if column exists first
    const columnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gangs' AND column_name = 'tag'
    `);
    
    if (columnExists.rows.length === 0) {
      console.log("Column 'tag' does not exist, adding it...");
      
      // Add tag column
      await db.execute(sql`
        ALTER TABLE gangs 
        ADD COLUMN tag TEXT
      `);
      
      console.log("Column 'tag' added successfully.");
      
      // Update existing rows to set a default tag value
      await db.execute(sql`
        UPDATE gangs
        SET tag = UPPER(SUBSTRING(name, 1, 3))
        WHERE tag IS NULL
      `);
      
      console.log("Updated existing gangs with default tags.");
    } else {
      console.log("Column 'tag' already exists, skipping migration.");
    }

    // Add more columns if needed for the new gang schema
    const columnsToAdd = [
      { name: "level", type: "INTEGER", default: "1" },
      { name: "experience", type: "INTEGER", default: "0" },
      { name: "respect", type: "INTEGER", default: "0" },
      { name: "strength", type: "INTEGER", default: "10" },
      { name: "defense", type: "INTEGER", default: "10" }
    ];

    for (const column of columnsToAdd) {
      const columnExists = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'gangs' AND column_name = ${column.name}
      `);

      if (columnExists.rows.length === 0) {
        console.log(`Column '${column.name}' does not exist, adding it...`);
        
        await db.execute(sql`
          ALTER TABLE gangs 
          ADD COLUMN ${sql.raw(column.name)} ${sql.raw(column.type)} DEFAULT ${column.default}
        `);
        
        console.log(`Column '${column.name}' added successfully.`);
      } else {
        console.log(`Column '${column.name}' already exists, skipping.`);
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
addTagColumnToGangs();