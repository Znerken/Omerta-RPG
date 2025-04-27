import { db } from "./db";
import { sql } from "drizzle-orm";

// Simple interface for gang data
interface CreateGangData {
  name: string;
  tag: string;
  description?: string;
  ownerId: number;
}

interface Gang {
  id: number;
  name: string;
  tag: string;
  description: string | null;
  bankBalance: number;
  level: number;
  experience: number;
  respect: number;
  strength: number;
  defense: number;
  ownerId: number;
  createdAt: Date | null;
}

// Simple test storage service for gangs
export class TestGangStorage {
  // Create a new gang
  async createGang(data: CreateGangData): Promise<Gang | null> {
    try {
      console.log(`[Test Gang Storage] Creating gang with data:`, data);
      
      // Use the test table we created
      const result = await db.execute(sql.raw(`
        INSERT INTO gangs_test (name, tag, description, owner_id)
        VALUES ('${data.name}', '${data.tag}', '${data.description || ""}', ${data.ownerId})
        RETURNING *
      `));
      
      if (result.rows.length > 0) {
        const gangData = result.rows[0];
        console.log(`[Test Gang Storage] Gang created successfully:`, gangData);
        
        // Convert to camelCase for consistency
        return {
          id: gangData.id,
          name: gangData.name,
          tag: gangData.tag,
          description: gangData.description,
          bankBalance: gangData.bank_balance || 0,
          level: gangData.level || 1,
          experience: gangData.experience || 0,
          respect: gangData.respect || 0,
          strength: gangData.strength || 10,
          defense: gangData.defense || 10,
          ownerId: gangData.owner_id,
          createdAt: gangData.created_at
        };
      }
      
      return null;
    } catch (error) {
      console.error("[Test Gang Storage] Error creating gang:", error);
      throw error;
    }
  }
  
  // Get all gangs
  async getAllGangs(): Promise<Gang[]> {
    try {
      const result = await db.execute(sql.raw(`
        SELECT * FROM gangs_test
      `));
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        tag: row.tag,
        description: row.description,
        bankBalance: row.bank_balance || 0,
        level: row.level || 1,
        experience: row.experience || 0,
        respect: row.respect || 0,
        strength: row.strength || 10,
        defense: row.defense || 10,
        ownerId: row.owner_id,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error("[Test Gang Storage] Error getting all gangs:", error);
      return [];
    }
  }
}

// Create an instance for use in routes
export const testGangStorage = new TestGangStorage();