import { db } from "./db";
import { 
  gangs, insertGangSchema, InsertGang, Gang,
  gangMembers, insertGangMemberSchema, InsertGangMember, GangMember,
  gangTerritories, insertGangTerritorySchema, InsertGangTerritory, GangTerritory,
  gangWars, insertGangWarSchema, InsertGangWar, GangWar,
  gangWarParticipants, insertGangWarParticipantSchema, InsertGangWarParticipant, GangWarParticipant,
  gangMissions, insertGangMissionSchema, InsertGangMission, GangMission,
  gangMissionAttempts, insertGangMissionAttemptSchema, InsertGangMissionAttempt, GangMissionAttempt,
  users, User
} from "@shared/schema";
import { eq, and, or, ne, desc, asc, sql, count, sum, gte, lte, inArray } from "drizzle-orm";
import { fixGangSchema } from "./migrations/gang-schema-fix";

/**
 * GangStorage class that handles all database operations for gangs
 */
export class GangStorage {
  /**
   * Initialize gang storage by ensuring schema is up-to-date
   */
  async initialize() {
    try {
      console.log("Initializing gang storage...");
      // Run gang schema migration to ensure tables exist
      const success = await fixGangSchema();
      return success;
    } catch (error) {
      console.error("Error initializing gang storage:", error);
      return false;
    }
  }

  /**
   * Get all gangs with member count
   */
  async getAllGangs(): Promise<Gang[]> {
    try {
      console.log("Getting all gangs - handling potential schema issues");
      
      // Use a direct SQL query to avoid ORM schema issues
      const result = await db.execute(sql.raw(`
        SELECT * FROM gangs
      `));
      
      // Map the results to our expected Gang type format
      const gangs = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        tag: row.tag || "",
        description: row.description,
        logo: row.logo,
        bankBalance: row.bank_balance || 0,
        level: row.level || 1,
        experience: row.experience || 0,
        respect: row.respect || 0,
        strength: row.strength || 10,
        defense: row.defense || 10,
        ownerId: row.leader_id || row.owner_id, // Handle both column names
        createdAt: row.created_at
      }));
      
      // For each gang, get the member count
      const results = await Promise.all(
        gangs.map(async (gang) => {
          const memberCount = await this.getGangMemberCount(gang.id);
          return {
            ...gang,
            memberCount
          };
        })
      );
      
      return results;
    } catch (error) {
      console.error("Error getting all gangs, likely schema mismatch. Returning empty array:", error);
      return [];
    }
  }

  /**
   * Get gang by ID
   */
  async getGang(id: number): Promise<Gang | undefined> {
    try {
      // Use direct SQL to avoid schema issues
      const result = await db.execute(sql.raw(`
        SELECT * FROM gangs WHERE id = ${id}
      `));
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      // Map to our expected Gang interface
      return {
        id: row.id,
        name: row.name,
        tag: row.tag || "",
        description: row.description,
        logo: row.logo,
        bankBalance: row.bank_balance || 0,
        level: row.level || 1,
        experience: row.experience || 0,
        respect: row.respect || 0,
        strength: row.strength || 10,
        defense: row.defense || 10,
        ownerId: row.leader_id || row.owner_id, // Handle both column names
        createdAt: row.created_at
      };
    } catch (error) {
      console.error(`Error getting gang with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get gang by name
   */
  async getGangByName(name: string): Promise<Gang | undefined> {
    try {
      // Use direct SQL to avoid schema issues
      const result = await db.execute(sql.raw(`
        SELECT * FROM gangs WHERE name = '${name}'
      `));
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      // Map to our expected Gang interface
      return {
        id: row.id,
        name: row.name,
        tag: row.tag || "",
        description: row.description,
        logo: row.logo,
        bankBalance: row.bank_balance || 0,
        level: row.level || 1,
        experience: row.experience || 0,
        respect: row.respect || 0,
        strength: row.strength || 10,
        defense: row.defense || 10,
        ownerId: row.leader_id || row.owner_id, // Handle both column names
        createdAt: row.created_at
      };
    } catch (error) {
      console.error(`Error getting gang with name ${name}:`, error);
      return undefined;
    }
  }

  /**
   * Get gang by tag
   */
  async getGangByTag(tag: string): Promise<Gang | undefined> {
    try {
      // Use direct SQL to avoid schema issues
      const result = await db.execute(sql.raw(`
        SELECT * FROM gangs WHERE tag = '${tag}'
      `));
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      // Map to our expected Gang interface
      return {
        id: row.id,
        name: row.name,
        tag: row.tag || "",
        description: row.description,
        logo: row.logo,
        bankBalance: row.bank_balance || 0,
        level: row.level || 1,
        experience: row.experience || 0,
        respect: row.respect || 0,
        strength: row.strength || 10,
        defense: row.defense || 10,
        ownerId: row.leader_id || row.owner_id, // Handle both column names
        createdAt: row.created_at
      };
    } catch (error) {
      console.error(`Error getting gang with tag ${tag}:`, error);
      return undefined;
    }
  }

  /**
   * Create a new gang
   */
  async createGang(gangData: InsertGang): Promise<Gang> {
    try {
      console.log("[Gang Storage] Creating gang with data:", gangData);
      
      // Use sql template literal to properly handle parameters
      const result = await db.execute(sql`
        INSERT INTO gangs 
        (name, tag, description, logo, leader_id) 
        VALUES 
        (${gangData.name}, ${gangData.tag}, ${gangData.description || null}, ${gangData.logo || null}, ${gangData.ownerId})
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        throw new Error("Gang creation failed - no gang returned");
      }
      
      const row = result.rows[0];
      
      // Map to Gang interface
      const newGang: Gang = {
        id: row.id,
        name: row.name,
        tag: row.tag || "",
        description: row.description,
        logo: row.logo,
        bankBalance: row.bank_balance || 0,
        level: row.level || 1, 
        experience: row.experience || 0,
        respect: row.respect || 0,
        strength: row.strength || 10,
        defense: row.defense || 10,
        ownerId: row.leader_id || row.owner_id,
        createdAt: row.created_at
      };
      
      console.log("[Gang Storage] Gang created successfully:", newGang);
      
      return newGang;
    } catch (error) {
      console.error("Error creating gang:", error);
      throw error;
    }
  }

  /**
   * Update an existing gang
   */
  async updateGang(gangId: number, gangData: Partial<Gang>): Promise<Gang | undefined> {
    try {
      const [updatedGang] = await db
        .update(gangs)
        .set(gangData)
        .where(eq(gangs.id, gangId))
        .returning();
      return updatedGang;
    } catch (error) {
      console.error(`Error updating gang with ID ${gangId}:`, error);
      return undefined;
    }
  }

  /**
   * Delete a gang and all related records
   */
  async deleteGang(gangId: number): Promise<boolean> {
    try {
      // Begin transaction
      await db.execute(sql`BEGIN`);
      
      // Remove all members from gang
      await db.delete(gangMembers).where(eq(gangMembers.gangId, gangId));
      
      // Remove gang from territories
      await db.update(gangTerritories)
        .set({ controlledBy: null })
        .where(eq(gangTerritories.controlledBy, gangId));
      
      // Delete gang wars involving this gang
      const wars = await db.select({ id: gangWars.id })
        .from(gangWars)
        .where(
          or(
            eq(gangWars.attackerId, gangId),
            eq(gangWars.defenderId, gangId)
          )
        );
      
      for (const war of wars) {
        // Delete war participants
        await db.delete(gangWarParticipants).where(eq(gangWarParticipants.warId, war.id));
      }
      
      // Delete wars
      await db.delete(gangWars)
        .where(
          or(
            eq(gangWars.attackerId, gangId),
            eq(gangWars.defenderId, gangId)
          )
        );
      
      // Delete mission attempts
      await db.delete(gangMissionAttempts).where(eq(gangMissionAttempts.gangId, gangId));
      
      // Delete the gang
      await db.delete(gangs).where(eq(gangs.id, gangId));
      
      // Commit transaction
      await db.execute(sql`COMMIT`);
      
      return true;
    } catch (error) {
      // Rollback on error
      await db.execute(sql`ROLLBACK`);
      console.error(`Error deleting gang with ID ${gangId}:`, error);
      return false;
    }
  }

  /**
   * Get gang with all details (members, territories, wars, missions)
   */
  async getGangWithDetails(gangId: number): Promise<any> {
    try {
      // Get the basic gang info
      const gang = await this.getGang(gangId);
      if (!gang) {
        return null;
      }
      
      // Get members
      const members = await this.getGangMembers(gangId);
      
      // Get controlled territories
      const territories = await this.getGangTerritories(gangId);
      
      // Get active wars
      const activeWars = await this.getGangActiveWars(gangId);
      
      // Get active missions
      const activeMissions = await this.getGangActiveMissions(gangId);
      
      return {
        ...gang,
        members,
        territories,
        activeWars,
        activeMissions
      };
    } catch (error) {
      console.error(`Error getting details for gang with ID ${gangId}:`, error);
      return null;
    }
  }

  /**
   * Get gang member count
   */
  async getGangMemberCount(gangId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(gangMembers)
        .where(eq(gangMembers.gangId, gangId));
      
      return result ? result.count : 0;
    } catch (error) {
      console.error(`Error getting member count for gang with ID ${gangId}:`, error);
      return 0;
    }
  }

  /**
   * Get members of a gang with user details
   */
  async getGangMembers(gangId: number): Promise<any[]> {
    try {
      // Use sql template literal to properly handle parameters
      const result = await db.execute(sql`
        SELECT gm.id, gm.gang_id, gm.user_id, gm.role, gm.joined_at, 
               u.id as user_id, u.username, u.level, u.avatar
        FROM gang_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.gang_id = ${gangId}
      `);
      
      // Format the results
      const membersWithDetails = result.rows.map(row => {
        return {
          id: row.id,
          gangId: row.gang_id,
          userId: row.user_id,
          role: row.role,
          joinedAt: row.joined_at,
          user: {
            id: row.user_id,
            username: row.username,
            level: row.level,
            avatar: row.avatar
          }
        };
      });
      
      return membersWithDetails;
    } catch (error) {
      console.error(`Error getting members for gang with ID ${gangId}:`, error);
      return [];
    }
  }

  /**
   * Get a specific gang member
   */
  async getGangMember(userId: number): Promise<any | undefined> {
    try {
      console.log('[DEBUG] getGangMember called for userId:', userId);
      
      // Use a simple SQL query with parameter interpolation
      const query = sql`
        SELECT gm.*, g.* 
        FROM gang_members gm
        JOIN gangs g ON gm.gang_id = g.id
        WHERE gm.user_id = ${userId}
      `;
      
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        console.log(`[DEBUG] No gang membership found for user ${userId}`);
        return undefined;
      }
      
      const member = result.rows[0];
      console.log(`[DEBUG] Found gang membership for user ${userId}:`, JSON.stringify(member));
      
      // Get gang info from the joined query
      const gang = {
        id: member.id,
        name: member.name,
        tag: member.tag,
        description: member.description,
        logo: member.logo,
        bankBalance: member.bank_balance,
        level: member.level,
        experience: member.experience,
        respect: member.respect,
        strength: member.strength,
        defense: member.defense,
        createdAt: member.created_at,
        ownerId: member.owner_id
      };
      
      // Convert snake_case to camelCase for consistency
      return {
        id: member.id,
        gangId: member.gang_id,
        userId: member.user_id,
        role: member.role,
        joinedAt: member.joined_at,
        gang
      };
    } catch (error) {
      console.error(`Error in getGangMember:`, error);
      
      // Fallback to a simpler query if the JOIN fails
      try {
        console.log('[DEBUG] Attempting fallback query for getGangMember');
        
        // Use simple SQL template query 
        const fallbackQuery = sql`
          SELECT * FROM gang_members WHERE user_id = ${userId}
        `;
        
        const fallbackResult = await db.execute(fallbackQuery);
        
        if (!fallbackResult.rows || fallbackResult.rows.length === 0) {
          console.log(`[DEBUG] Fallback: No gang membership found for user ${userId}`);
          return undefined;
        }
        
        const member = fallbackResult.rows[0];
        console.log(`[DEBUG] Fallback: Found gang membership:`, JSON.stringify(member));
        
        // Get gang info separately
        const gangQuery = sql`
          SELECT * FROM gangs WHERE id = ${member.gang_id}
        `;
        
        const gangResult = await db.execute(gangQuery);
        
        if (!gangResult.rows || gangResult.rows.length === 0) {
          console.log(`[DEBUG] Fallback: No gang found with ID ${member.gang_id}`);
          return undefined;
        }
        
        const gang = gangResult.rows[0];
        
        return {
          id: member.id,
          gangId: member.gang_id,
          userId: member.user_id,
          role: member.role,
          joinedAt: member.joined_at,
          gang: {
            id: gang.id,
            name: gang.name,
            tag: gang.tag,
            description: gang.description,
            logo: gang.logo,
            bankBalance: gang.bank_balance,
            level: gang.level,
            experience: gang.experience,
            respect: gang.respect,
            strength: gang.strength,
            defense: gang.defense,
            createdAt: gang.created_at,
            ownerId: gang.owner_id
          }
        };
      } catch (fallbackError) {
        console.error(`Error in getGangMember fallback:`, fallbackError);
        return undefined;
      }
    }
  }

  /**
   * Add a user to a gang
   */
  async addGangMember(data: InsertGangMember): Promise<GangMember> {
    try {
      console.log(`[DEBUG] Adding user ${data.userId} to gang ${data.gangId} with role ${data.role}`);
      
      // Begin transaction
      await db.execute(sql`BEGIN`);
      
      // Check if user is already in a gang
      const checkResult = await db.execute(sql`
        SELECT * FROM gang_members WHERE user_id = ${data.userId}
      `);
      
      if (checkResult.rows && checkResult.rows.length > 0) {
        console.log(`[DEBUG] User ${data.userId} is already in a gang, removing from previous gang`);
        
        // Remove from previous gang
        await db.execute(sql`
          DELETE FROM gang_members WHERE user_id = ${data.userId}
        `);
      }
      
      // Add member to gang using parameterized query to avoid SQL injection
      const result = await db.execute(sql`
        INSERT INTO gang_members (gang_id, user_id, role)
        VALUES (${data.gangId}, ${data.userId}, ${data.role})
        RETURNING *
      `);
      
      if (!result.rows || result.rows.length === 0) {
        console.log(`[DEBUG] Failed to add user ${data.userId} to gang ${data.gangId}`);
        await db.execute(sql`ROLLBACK`);
        throw new Error("Failed to add user to gang");
      }
      
      const member = result.rows[0];
      console.log(`[DEBUG] Added user ${data.userId} to gang ${data.gangId}`, JSON.stringify(member));
      
      // Update user's gang_id
      await db.execute(sql`
        UPDATE users SET gang_id = ${data.gangId} WHERE id = ${data.userId}
      `);
      
      // Commit transaction
      await db.execute(sql`COMMIT`);
      
      console.log(`[DEBUG] Successfully added user ${data.userId} to gang ${data.gangId}`);
      
      // Convert snake_case to camelCase for consistency
      return {
        id: member.id,
        gangId: member.gang_id,
        userId: member.user_id,
        role: member.role,
        contribution: member.contribution || 0,
        joinedAt: member.joined_at
      };
    } catch (error) {
      // Rollback on error
      await db.execute(sql`ROLLBACK`);
      console.error("Error adding gang member:", error);
      throw error;
    }
  }

  /**
   * Remove a user from a gang
   */
  async removeGangMember(userId: number, gangId: number): Promise<boolean> {
    try {
      console.log(`[DEBUG] Removing user ${userId} from gang ${gangId}`);
      
      // Begin transaction
      await db.execute(sql`BEGIN`);
      
      // Check if user is actually in the gang first
      const checkResult = await db.execute(sql`
        SELECT * FROM gang_members WHERE user_id = ${userId} AND gang_id = ${gangId}
      `);
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        console.log(`[DEBUG] User ${userId} is not a member of gang ${gangId}`);
        await db.execute(sql`ROLLBACK`);
        return false;
      }
      
      console.log(`[DEBUG] Found gang membership to remove:`, JSON.stringify(checkResult.rows[0]));
      
      // Remove member from gang
      await db.execute(sql`
        DELETE FROM gang_members WHERE user_id = ${userId} AND gang_id = ${gangId}
      `);
      
      // Update user's gang_id to null
      await db.execute(sql`
        UPDATE users SET gang_id = NULL WHERE id = ${userId}
      `);
      
      // Commit transaction
      await db.execute(sql`COMMIT`);
      
      console.log(`[DEBUG] Successfully removed user ${userId} from gang ${gangId}`);
      return true;
    } catch (error) {
      // Rollback on error
      await db.execute(sql`ROLLBACK`);
      console.error(`Error removing user ${userId} from gang ${gangId}:`, error);
      return false;
    }
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(userId: number, gangId: number, role: string): Promise<GangMember | undefined> {
    try {
      // Using role column instead of rank
      const [updatedMember] = await db
        .update(gangMembers)
        .set({ role: role })
        .where(
          and(
            eq(gangMembers.userId, userId),
            eq(gangMembers.gangId, gangId)
          )
        )
        .returning();
      
      // For compatibility with existing code:
      if (updatedMember) {
        // @ts-ignore
        updatedMember.rank = updatedMember.role;
      }
      
      return updatedMember;
    } catch (error) {
      console.error(`Error updating role for user ${userId} in gang ${gangId}:`, error);
      return undefined;
    }
  }

  /**
   * Update a member's contribution amount
   */
  async updateMemberContribution(userId: number, gangId: number, amount: number): Promise<GangMember | undefined> {
    try {
      console.log(`[DEBUG] Updating contribution for user ${userId} in gang ${gangId} by ${amount}`);
      
      // Get current contribution
      const findResult = await db.execute(sql`
        SELECT * FROM gang_members 
        WHERE user_id = ${userId} AND gang_id = ${gangId}
      `);
      
      if (!findResult.rows || findResult.rows.length === 0) {
        console.log(`[DEBUG] No gang membership found for user ${userId} in gang ${gangId}`);
        return undefined;
      }
      
      const member = findResult.rows[0];
      console.log(`[DEBUG] Found gang membership:`, JSON.stringify(member));
      
      const currentContribution = member.contribution || 0;
      const newContribution = currentContribution + amount;
      console.log(`[DEBUG] Updating contribution from ${currentContribution} to ${newContribution}`);
      
      // Update contribution
      const updateResult = await db.execute(sql`
        UPDATE gang_members 
        SET contribution = ${newContribution}
        WHERE user_id = ${userId} AND gang_id = ${gangId}
        RETURNING *
      `);
      
      if (!updateResult.rows || updateResult.rows.length === 0) {
        console.log(`[DEBUG] Failed to update contribution for user ${userId} in gang ${gangId}`);
        return undefined;
      }
      
      const updatedMember = updateResult.rows[0];
      console.log(`[DEBUG] Successfully updated contribution for user ${userId} in gang ${gangId}`);
      
      // Convert snake_case to camelCase for consistency
      return {
        id: updatedMember.id,
        gangId: updatedMember.gang_id,
        userId: updatedMember.user_id,
        role: updatedMember.role,
        contribution: updatedMember.contribution || 0,
        joinedAt: updatedMember.joined_at
      };
    } catch (error) {
      console.error(`Error updating contribution for user ${userId} in gang ${gangId}:`, error);
      return undefined;
    }
  }

  /**
   * Get all gang territories
   */
  async getAllTerritories(): Promise<GangTerritory[]> {
    try {
      return await db
        .select()
        .from(gangTerritories)
        .orderBy(asc(gangTerritories.name));
    } catch (error) {
      console.error("Error getting territories:", error);
      return [];
    }
  }

  /**
   * Get a specific territory
   */
  async getTerritory(id: number): Promise<GangTerritory | undefined> {
    try {
      const [territory] = await db
        .select()
        .from(gangTerritories)
        .where(eq(gangTerritories.id, id));
      
      return territory;
    } catch (error) {
      console.error(`Error getting territory with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get territories controlled by a gang
   */
  async getGangTerritories(gangId: number): Promise<GangTerritory[]> {
    try {
      return await db
        .select()
        .from(gangTerritories)
        .where(eq(gangTerritories.controlledBy, gangId));
    } catch (error) {
      console.error(`Error getting territories for gang with ID ${gangId}:`, error);
      return [];
    }
  }

  /**
   * Get a territory with controlling gang details
   */
  async getTerritoryWithDetails(id: number): Promise<any | undefined> {
    try {
      const territory = await this.getTerritory(id);
      
      if (!territory) {
        return undefined;
      }
      
      let controllingGang = null;
      if (territory.controlledBy) {
        controllingGang = await this.getGang(territory.controlledBy);
      }
      
      return {
        ...territory,
        controllingGang
      };
    } catch (error) {
      console.error(`Error getting details for territory with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Create a new territory
   */
  async createTerritory(data: InsertGangTerritory): Promise<GangTerritory> {
    try {
      const [territory] = await db
        .insert(gangTerritories)
        .values(data)
        .returning();
      
      return territory;
    } catch (error) {
      console.error("Error creating territory:", error);
      throw error;
    }
  }

  /**
   * Update a territory
   */
  async updateTerritory(id: number, data: Partial<GangTerritory>): Promise<GangTerritory | undefined> {
    try {
      const [territory] = await db
        .update(gangTerritories)
        .set(data)
        .where(eq(gangTerritories.id, id))
        .returning();
      
      return territory;
    } catch (error) {
      console.error(`Error updating territory with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Change territory control
   */
  async changeTerritoryControl(territoryId: number, gangId: number | null): Promise<GangTerritory | undefined> {
    try {
      const [territory] = await db
        .update(gangTerritories)
        .set({ 
          controlledBy: gangId,
          // Set a cooldown period if gang is taking control
          attackCooldown: gangId ? new Date(Date.now() + (24 * 60 * 60 * 1000)) : null
        })
        .where(eq(gangTerritories.id, territoryId))
        .returning();
      
      return territory;
    } catch (error) {
      console.error(`Error changing control of territory ${territoryId}:`, error);
      return undefined;
    }
  }

  /**
   * Get all gang wars
   */
  async getAllGangWars(): Promise<GangWar[]> {
    try {
      return await db
        .select()
        .from(gangWars)
        .orderBy(desc(gangWars.startTime));
    } catch (error) {
      console.error("Error getting gang wars:", error);
      return [];
    }
  }

  /**
   * Get active gang wars
   */
  async getActiveGangWars(): Promise<GangWar[]> {
    try {
      return await db
        .select()
        .from(gangWars)
        .where(eq(gangWars.status, "active"))
        .orderBy(desc(gangWars.startTime));
    } catch (error) {
      console.error("Error getting active gang wars:", error);
      return [];
    }
  }

  /**
   * Get a specific gang war
   */
  async getGangWar(id: number): Promise<GangWar | undefined> {
    try {
      const [war] = await db
        .select()
        .from(gangWars)
        .where(eq(gangWars.id, id));
      
      return war;
    } catch (error) {
      console.error(`Error getting gang war with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get gang wars involving a specific gang
   */
  async getGangActiveWars(gangId: number): Promise<GangWar[]> {
    try {
      return await db
        .select()
        .from(gangWars)
        .where(
          and(
            or(
              eq(gangWars.attackerId, gangId),
              eq(gangWars.defenderId, gangId)
            ),
            eq(gangWars.status, "active")
          )
        )
        .orderBy(desc(gangWars.startTime));
    } catch (error) {
      console.error(`Error getting active wars for gang with ID ${gangId}:`, error);
      return [];
    }
  }

  /**
   * Create a new gang war
   */
  async createGangWar(data: InsertGangWar): Promise<GangWar> {
    try {
      const [war] = await db
        .insert(gangWars)
        .values(data)
        .returning();
      
      return war;
    } catch (error) {
      console.error("Error creating gang war:", error);
      throw error;
    }
  }

  /**
   * Update a gang war
   */
  async updateGangWar(id: number, data: Partial<GangWar>): Promise<GangWar | undefined> {
    try {
      const [war] = await db
        .update(gangWars)
        .set(data)
        .where(eq(gangWars.id, id))
        .returning();
      
      return war;
    } catch (error) {
      console.error(`Error updating gang war with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * End a gang war with a winner
   */
  async endGangWar(warId: number, winnerId: number): Promise<GangWar | undefined> {
    try {
      // Begin transaction
      await db.execute(sql`BEGIN`);
      
      // Get the war
      const war = await this.getGangWar(warId);
      if (!war) {
        await db.execute(sql`ROLLBACK`);
        return undefined;
      }
      
      // Update the war
      const [updatedWar] = await db
        .update(gangWars)
        .set({
          status: "completed",
          endTime: new Date(),
          winnerId
        })
        .where(eq(gangWars.id, warId))
        .returning();
      
      // If a territory was at stake, change its control
      if (war.territoryId) {
        await this.changeTerritoryControl(war.territoryId, winnerId);
      }
      
      // Commit transaction
      await db.execute(sql`COMMIT`);
      
      return updatedWar;
    } catch (error) {
      // Rollback on error
      await db.execute(sql`ROLLBACK`);
      console.error(`Error ending gang war with ID ${warId}:`, error);
      return undefined;
    }
  }

  /**
   * Add a participant to a gang war
   */
  async addGangWarParticipant(data: InsertGangWarParticipant): Promise<GangWarParticipant> {
    try {
      // Determine which side (attacker or defender)
      const [war] = await db
        .select()
        .from(gangWars)
        .where(eq(gangWars.id, data.warId));
      
      if (!war) {
        throw new Error("Gang war not found");
      }
      
      const side = war.attackerId === data.gangId ? "attacker" : "defender";
      
      // Add participant
      const [participant] = await db
        .insert(gangWarParticipants)
        .values({
          ...data,
          side
        })
        .returning();
      
      return participant;
    } catch (error) {
      console.error("Error adding war participant:", error);
      throw error;
    }
  }

  /**
   * Get a war participant
   */
  async getGangWarParticipant(userId: number, warId: number): Promise<GangWarParticipant | undefined> {
    try {
      const [participant] = await db
        .select()
        .from(gangWarParticipants)
        .where(
          and(
            eq(gangWarParticipants.userId, userId),
            eq(gangWarParticipants.warId, warId)
          )
        );
      
      return participant;
    } catch (error) {
      console.error(`Error getting war participant (user ${userId}, war ${warId}):`, error);
      return undefined;
    }
  }

  /**
   * Update a war participant's contribution
   */
  async updateWarParticipantContribution(userId: number, warId: number, amount: number): Promise<GangWarParticipant | undefined> {
    try {
      // Get current contribution
      const participant = await this.getGangWarParticipant(userId, warId);
      if (!participant) {
        return undefined;
      }
      
      // Update contribution
      const [updatedParticipant] = await db
        .update(gangWarParticipants)
        .set({ contribution: participant.contribution + amount })
        .where(
          and(
            eq(gangWarParticipants.userId, userId),
            eq(gangWarParticipants.warId, warId)
          )
        )
        .returning();
      
      // Update war strength based on participant's side
      const war = await this.getGangWar(warId);
      if (war) {
        if (participant.side === "attacker") {
          await this.updateGangWar(warId, {
            attackStrength: war.attackStrength + amount
          });
        } else {
          await this.updateGangWar(warId, {
            defenseStrength: war.defenseStrength + amount
          });
        }
      }
      
      return updatedParticipant;
    } catch (error) {
      console.error(`Error updating war contribution for user ${userId} in war ${warId}:`, error);
      return undefined;
    }
  }

  /**
   * Get all gang missions
   */
  async getAllGangMissions(): Promise<GangMission[]> {
    try {
      return await db
        .select()
        .from(gangMissions)
        .where(eq(gangMissions.isActive, true))
        .orderBy(asc(gangMissions.duration));
    } catch (error) {
      console.error("Error getting gang missions:", error);
      return [];
    }
  }

  /**
   * Get a specific gang mission
   */
  async getGangMission(id: number): Promise<GangMission | undefined> {
    try {
      const [mission] = await db
        .select()
        .from(gangMissions)
        .where(eq(gangMissions.id, id));
      
      return mission;
    } catch (error) {
      console.error(`Error getting gang mission with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get active missions for a gang
   */
  async getGangActiveMissions(gangId: number): Promise<any[]> {
    try {
      // Get all active attempts for this gang
      const attempts = await db
        .select()
        .from(gangMissionAttempts)
        .where(
          and(
            eq(gangMissionAttempts.gangId, gangId),
            eq(gangMissionAttempts.status, "in-progress")
          )
        );
      
      // Get mission details for each attempt
      const activeMissions = await Promise.all(
        attempts.map(async (attempt) => {
          const mission = await this.getGangMission(attempt.missionId);
          if (!mission) {
            return null;
          }
          
          return {
            ...mission,
            attempt
          };
        })
      );
      
      // Remove null entries
      return activeMissions.filter(Boolean);
    } catch (error) {
      console.error(`Error getting active missions for gang with ID ${gangId}:`, error);
      return [];
    }
  }

  /**
   * Get available missions for a gang
   */
  async getAvailableMissionsForGang(gangId: number): Promise<any[]> {
    try {
      // Get all missions
      const allMissions = await this.getAllGangMissions();
      
      // Get all attempts by this gang
      const attempts = await db
        .select()
        .from(gangMissionAttempts)
        .where(eq(gangMissionAttempts.gangId, gangId));
      
      // Get gang member count
      const memberCount = await this.getGangMemberCount(gangId);
      
      // Filter missions that are available
      return allMissions.map((mission) => {
        // Check if there's a cooldown active for this mission
        const recentAttempt = attempts.find(
          (attempt) => attempt.missionId === mission.id && attempt.nextAvailableAt
        );
        
        const now = new Date();
        const onCooldown = recentAttempt && recentAttempt.nextAvailableAt 
          ? recentAttempt.nextAvailableAt > now
          : false;
        
        // Check if gang has enough members
        const hasEnoughMembers = memberCount >= mission.requiredMembers;
        
        return {
          ...mission,
          canAttempt: !onCooldown && hasEnoughMembers,
          onCooldown,
          hasEnoughMembers,
          cooldownEnds: recentAttempt?.nextAvailableAt
        };
      });
    } catch (error) {
      console.error(`Error getting available missions for gang with ID ${gangId}:`, error);
      return [];
    }
  }

  /**
   * Start a mission attempt
   */
  async startMissionAttempt(gangId: number, missionId: number): Promise<GangMissionAttempt | undefined> {
    try {
      const mission = await this.getGangMission(missionId);
      if (!mission) {
        return undefined;
      }
      
      // Calculate when the mission will complete
      const startedAt = new Date();
      const completedAt = new Date(startedAt.getTime() + (mission.duration * 60 * 1000));
      
      // Calculate when the mission will be available again
      const nextAvailableAt = new Date(completedAt.getTime() + (mission.cooldown * 60 * 1000));
      
      // Create the attempt
      const [attempt] = await db
        .insert(gangMissionAttempts)
        .values({
          gangId,
          missionId,
          status: "in-progress",
          startedAt,
          completedAt,
          nextAvailableAt
        })
        .returning();
      
      return attempt;
    } catch (error) {
      console.error(`Error starting mission ${missionId} for gang ${gangId}:`, error);
      return undefined;
    }
  }

  /**
   * Check if a mission is complete
   */
  async checkMissionCompletion(attemptId: number): Promise<{ complete: boolean, attempt?: GangMissionAttempt, mission?: GangMission }> {
    try {
      // Get the attempt
      const [attempt] = await db
        .select()
        .from(gangMissionAttempts)
        .where(eq(gangMissionAttempts.id, attemptId));
      
      if (!attempt) {
        return { complete: false };
      }
      
      // If already completed or failed, return early
      if (attempt.status !== "in-progress") {
        return { complete: false, attempt };
      }
      
      // Get the mission
      const mission = await this.getGangMission(attempt.missionId);
      if (!mission) {
        return { complete: false, attempt };
      }
      
      // Check if the mission is complete
      const now = new Date();
      if (attempt.completedAt && attempt.completedAt <= now) {
        // Update the attempt
        const [updatedAttempt] = await db
          .update(gangMissionAttempts)
          .set({ status: "completed" })
          .where(eq(gangMissionAttempts.id, attemptId))
          .returning();
        
        return { complete: true, attempt: updatedAttempt, mission };
      }
      
      return { complete: false, attempt, mission };
    } catch (error) {
      console.error(`Error checking mission completion for attempt ${attemptId}:`, error);
      return { complete: false };
    }
  }

  /**
   * Collect mission rewards
   */
  async collectMissionRewards(attemptId: number): Promise<{
    success: boolean, 
    rewards?: { cash: number, respect: number, experience: number },
    error?: string
  }> {
    try {
      // Begin transaction
      await db.execute(sql`BEGIN`);
      
      // Check if mission is complete
      const { complete, attempt, mission } = await this.checkMissionCompletion(attemptId);
      
      if (!complete || !attempt || !mission) {
        await db.execute(sql`ROLLBACK`);
        return { success: false, error: "Mission is not complete yet" };
      }
      
      // Check if mission is already collected
      if (attempt.status !== "completed") {
        await db.execute(sql`ROLLBACK`);
        return { success: false, error: "Mission rewards already collected" };
      }
      
      // Get the gang
      const gang = await this.getGang(attempt.gangId);
      if (!gang) {
        await db.execute(sql`ROLLBACK`);
        return { success: false, error: "Gang not found" };
      }
      
      // Update gang with rewards
      await db
        .update(gangs)
        .set({
          bankBalance: gang.bankBalance + mission.cashReward,
          respect: gang.respect + mission.respectReward,
          experience: gang.experience + mission.experienceReward
        })
        .where(eq(gangs.id, attempt.gangId));
      
      // Update attempt status
      await db
        .update(gangMissionAttempts)
        .set({ status: "rewarded" })
        .where(eq(gangMissionAttempts.id, attemptId));
      
      // Commit transaction
      await db.execute(sql`COMMIT`);
      
      return {
        success: true,
        rewards: {
          cash: mission.cashReward,
          respect: mission.respectReward,
          experience: mission.experienceReward
        }
      };
    } catch (error) {
      // Rollback on error
      await db.execute(sql`ROLLBACK`);
      console.error(`Error collecting rewards for mission attempt ${attemptId}:`, error);
      return { success: false, error: "Unknown error occurred" };
    }
  }
}

export const gangStorage = new GangStorage();