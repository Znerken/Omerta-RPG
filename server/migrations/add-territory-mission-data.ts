import { db } from "../db";
import { sql } from "drizzle-orm";

async function addTerritoryAndMissionData() {
  try {
    console.log("Starting migration to add sample territory and mission data...");
    
    // Check if territories already exist
    const existingTerritories = await db.execute(sql.raw(`
      SELECT COUNT(*) FROM gang_territories
    `));
    
    if (parseInt(existingTerritories.rows[0].count) === 0) {
      console.log("Adding sample territories...");
      
      // Add sample territories
      const territories = [
        {
          name: "Downtown District",
          description: "The heart of the city with high-end businesses and opportunities.",
          income: 500,
          defense_bonus: 10,
          image: "/assets/territories/downtown.jpg"
        },
        {
          name: "Industrial Zone",
          description: "Factories and warehouses perfect for black market operations.",
          income: 350,
          defense_bonus: 15,
          image: "/assets/territories/industrial.jpg"
        },
        {
          name: "Dockside",
          description: "Control of the ports means control of smuggling operations.",
          income: 400,
          defense_bonus: 5,
          image: "/assets/territories/docks.jpg"
        },
        {
          name: "Nightlife District",
          description: "Clubs, bars, and entertainment venues ripe for protection rackets.",
          income: 450,
          defense_bonus: 8,
          image: "/assets/territories/nightlife.jpg"
        },
        {
          name: "Suburban Heights",
          description: "Wealthy residential area perfect for high-value robberies.",
          income: 300,
          defense_bonus: 20,
          image: "/assets/territories/suburban.jpg"
        }
      ];
      
      for (const territory of territories) {
        await db.execute(sql.raw(`
          INSERT INTO gang_territories (name, description, income, defense_bonus, image)
          VALUES ('${territory.name}', '${territory.description}', ${territory.income}, ${territory.defense_bonus}, '${territory.image}')
        `));
      }
      
      console.log("Sample territories added successfully.");
    } else {
      console.log("Territories already exist, skipping sample data insertion.");
    }
    
    // Check if missions already exist
    const existingMissions = await db.execute(sql.raw(`
      SELECT COUNT(*) FROM gang_missions
    `));
    
    if (parseInt(existingMissions.rows[0].count) === 0) {
      console.log("Adding sample missions...");
      
      // Add sample missions
      const missions = [
        {
          name: "Bank Heist",
          description: "Rob a high-security bank for a massive payday.",
          difficulty: "hard",
          duration: 60, // minutes
          cooldown: 360, // minutes
          required_members: 3,
          cash_reward: 10000,
          experience_reward: 500,
          respect_reward: 50
        },
        {
          name: "Protection Racket",
          description: "Convince local businesses they need your 'protection'.",
          difficulty: "easy",
          duration: 15,
          cooldown: 60,
          required_members: 1,
          cash_reward: 2000,
          experience_reward: 100,
          respect_reward: 10
        },
        {
          name: "Drug Shipment",
          description: "Escort a valuable drug shipment across town.",
          difficulty: "medium",
          duration: 30,
          cooldown: 120,
          required_members: 2,
          cash_reward: 5000,
          experience_reward: 250,
          respect_reward: 25
        },
        {
          name: "Casino Takeover",
          description: "Take control of a local casino and its operations.",
          difficulty: "hard",
          duration: 90,
          cooldown: 480,
          required_members: 4,
          cash_reward: 15000,
          experience_reward: 750,
          respect_reward: 75
        },
        {
          name: "Street Race",
          description: "Organize an illegal street race for betting revenue.",
          difficulty: "medium",
          duration: 45,
          cooldown: 180,
          required_members: 2,
          cash_reward: 6000,
          experience_reward: 300,
          respect_reward: 30
        }
      ];
      
      for (const mission of missions) {
        await db.execute(sql.raw(`
          INSERT INTO gang_missions (
            name, description, difficulty, duration, cooldown, 
            required_members, cash_reward, experience_reward, respect_reward
          )
          VALUES (
            '${mission.name}', '${mission.description}', '${mission.difficulty}', 
            ${mission.duration}, ${mission.cooldown}, ${mission.required_members}, 
            ${mission.cash_reward}, ${mission.experience_reward}, ${mission.respect_reward}
          )
        `));
      }
      
      console.log("Sample missions added successfully.");
    } else {
      console.log("Missions already exist, skipping sample data insertion.");
    }

    console.log("Sample data migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during sample data migration:", error);
    return false;
  }
}

// Execute the migration
addTerritoryAndMissionData();