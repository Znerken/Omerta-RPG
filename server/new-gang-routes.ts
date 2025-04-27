import { Router, Request, Response } from "express";
import { gangStorage } from "./storage-gang";
import { 
  insertGangSchema, 
  insertGangMemberSchema, 
  insertGangWarSchema, 
  insertGangWarParticipantSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./middleware/auth";
import { sql } from "drizzle-orm";
import { db } from "./db";

// Initialize router
const gangRouter = Router();

// Middleware to ensure gang schema is initialized
gangRouter.use(async (req, res, next) => {
  try {
    if (req.method === "GET") {
      // Skip initialization for GET requests to avoid unnecessary migrations
      next();
      return;
    }

    const initialized = await gangStorage.initialize();
    if (!initialized) {
      console.warn("Gang storage initialization failed, but proceeding anyway");
    }
    next();
  } catch (error) {
    console.error("Error in gang routes middleware:", error);
    next();
  }
});

// GANG MANAGEMENT ROUTES

/**
 * Get all gangs
 * GET /api/gangs
 */
gangRouter.get("/", async (req: Request, res: Response) => {
  try {
    const gangs = await gangStorage.getAllGangs();
    res.json(gangs);
  } catch (error) {
    console.error("Error fetching gangs:", error);
    res.status(500).json({ message: "Failed to fetch gangs" });
  }
});

/**
 * Get a specific gang by ID
 * GET /api/gangs/:id
 */
gangRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    // Get gang basic details first
    const gang = await gangStorage.getGang(id);
    
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    // Get members manually
    console.log("Fetching members for gang with ID", id);
    const members = await gangStorage.getGangMembers(id);
    console.log("Retrieved members:", members);
    
    // Get active wars
    const activeWars = await gangStorage.getGangActiveWars(id);
    
    // Get territories
    const territories = await gangStorage.getGangTerritories(id);
    
    // Get active missions
    const activeMissions = await gangStorage.getGangActiveMissions(id);
    
    // Combine everything
    const gangWithDetails = {
      ...gang,
      members,
      territories,
      activeWars,
      activeMissions
    };
    
    res.json(gangWithDetails);
  } catch (error) {
    console.error("Error fetching gang details:", error);
    res.status(500).json({ message: "Failed to fetch gang details" });
  }
});

/**
 * Create a new gang
 * POST /api/gangs
 */
gangRouter.post("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Check if user is already in a gang
    const existingMembership = await gangStorage.getGangMember(req.user.id);
    if (existingMembership) {
      return res.status(400).json({ 
        message: "You are already a member of a gang" 
      });
    }
    
    // Validate request body against schema
    const gangData = insertGangSchema.parse({
      ...req.body,
      ownerId: req.user.id
    });
    
    // Check gang name and tag uniqueness
    const existingGangByName = await gangStorage.getGangByName(gangData.name);
    if (existingGangByName) {
      return res.status(400).json({ message: "Gang name already taken" });
    }
    
    const existingGangByTag = await gangStorage.getGangByTag(gangData.tag);
    if (existingGangByTag) {
      return res.status(400).json({ message: "Gang tag already taken" });
    }
    
    // Create the gang
    const newGang = await gangStorage.createGang(gangData);
    
    // Add founder as a member with Leader role
    await gangStorage.addGangMember({
      gangId: newGang.id,
      userId: req.user.id,
      role: "Leader"
    });
    
    res.status(201).json(newGang);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Invalid gang data", 
        errors: error.errors 
      });
    }
    
    console.error("Error creating gang:", error);
    res.status(500).json({ message: "Failed to create gang" });
  }
});

/**
 * Update a gang
 * PATCH /api/gangs/:id
 */
gangRouter.patch("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    // Check if the user is a leader of this gang
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership || membership.gangId !== gangId || membership.role !== "Leader") {
      return res.status(403).json({ message: "Only the gang leader can update the gang" });
    }
    
    // Make sure these fields can't be updated
    const { id, ownerId, bankBalance, level, experience, respect, strength, defense, ...updateData } = req.body;
    
    // Update the gang
    const updatedGang = await gangStorage.updateGang(gangId, updateData);
    if (!updatedGang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    res.json(updatedGang);
  } catch (error) {
    console.error("Error updating gang:", error);
    res.status(500).json({ message: "Failed to update gang" });
  }
});

/**
 * Delete a gang
 * DELETE /api/gangs/:id
 */
gangRouter.delete("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    // Only the owner can delete a gang, or an admin
    const membership = await gangStorage.getGangMember(req.user.id);
    const isOwner = membership && membership.gangId === gangId && membership.role === "Leader";
    
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: "Only the gang leader or an admin can delete the gang" });
    }
    
    // Delete the gang
    const success = await gangStorage.deleteGang(gangId);
    if (!success) {
      return res.status(500).json({ message: "Failed to delete gang" });
    }
    
    res.json({ message: "Gang deleted successfully" });
  } catch (error) {
    console.error("Error deleting gang:", error);
    res.status(500).json({ message: "Failed to delete gang" });
  }
});

// GANG MEMBERSHIP ROUTES

/**
 * Join a gang
 * POST /api/gangs/:id/join
 */
gangRouter.post("/:id/join", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    // Check if user is already in a gang
    const existingMembership = await gangStorage.getGangMember(req.user.id);
    if (existingMembership) {
      return res.status(400).json({ 
        message: "You are already a member of a gang" 
      });
    }
    
    // Check if gang exists
    const gang = await gangStorage.getGang(gangId);
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    // Add user as a member with the default "Soldier" role
    const gangMember = await gangStorage.addGangMember({
      gangId,
      userId: req.user.id,
      role: "Soldier"
    });
    
    res.status(201).json(gangMember);
  } catch (error) {
    console.error("Error joining gang:", error);
    res.status(500).json({ message: "Failed to join gang" });
  }
});

/**
 * Leave a gang
 * POST /api/gangs/:id/leave
 */
gangRouter.post("/:id/leave", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    // Check if user is in this gang
    const existingMembership = await gangStorage.getGangMember(req.user.id);
    if (!existingMembership || existingMembership.gangId !== gangId) {
      return res.status(400).json({ 
        message: "You are not a member of this gang" 
      });
    }
    
    // Leaders can't leave unless they're the only member
    if (existingMembership.role === "Leader") {
      const memberCount = await gangStorage.getGangMemberCount(gangId);
      if (memberCount > 1) {
        return res.status(400).json({ 
          message: "Leaders must promote another member before leaving" 
        });
      }
    }
    
    // Remove user from gang
    const success = await gangStorage.removeGangMember(req.user.id, gangId);
    if (!success) {
      return res.status(500).json({ message: "Failed to leave gang" });
    }
    
    res.json({ message: "You have left the gang" });
  } catch (error) {
    console.error("Error leaving gang:", error);
    res.status(500).json({ message: "Failed to leave gang" });
  }
});

/**
 * Promote a gang member
 * POST /api/gangs/:id/members/:userId/promote
 */
gangRouter.post("/:id/members/:userId/promote", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    
    if (isNaN(gangId) || isNaN(targetUserId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }
    
    // Check if user is in this gang with appropriate role
    const userMembership = await gangStorage.getGangMember(req.user.id);
    if (!userMembership || userMembership.gangId !== gangId || userMembership.role !== "Leader") {
      return res.status(403).json({ message: "Only the gang leader can promote members" });
    }
    
    // Check if target user is in this gang
    const targetMembership = await gangStorage.getGangMember(targetUserId);
    if (!targetMembership || targetMembership.gangId !== gangId) {
      return res.status(404).json({ message: "Target user is not a member of this gang" });
    }
    
    // Determine new role
    let newRank = "Soldier";
    switch (targetMembership.role) {
      case "Soldier":
        newRank = "Capo";
        break;
      case "Capo":
        newRank = "Underboss";
        break;
      case "Underboss":
        // Can't promote beyond Underboss
        return res.status(400).json({ message: "Cannot promote beyond Underboss" });
      default:
        newRank = "Soldier";
    }
    
    // Update role
    const updatedMember = await gangStorage.updateMemberRole(targetUserId, gangId, newRank);
    if (!updatedMember) {
      return res.status(500).json({ message: "Failed to promote member" });
    }
    
    res.json({ message: `Successfully promoted to ${newRank}`, member: updatedMember });
  } catch (error) {
    console.error("Error promoting gang member:", error);
    res.status(500).json({ message: "Failed to promote gang member" });
  }
});

/**
 * Demote a gang member
 * POST /api/gangs/:id/members/:userId/demote
 */
gangRouter.post("/:id/members/:userId/demote", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    
    if (isNaN(gangId) || isNaN(targetUserId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }
    
    // Check if user is in this gang with appropriate role
    const userMembership = await gangStorage.getGangMember(req.user.id);
    if (!userMembership || userMembership.gangId !== gangId || userMembership.role !== "Leader") {
      return res.status(403).json({ message: "Only the gang leader can demote members" });
    }
    
    // Check if target user is in this gang
    const targetMembership = await gangStorage.getGangMember(targetUserId);
    if (!targetMembership || targetMembership.gangId !== gangId) {
      return res.status(404).json({ message: "Target user is not a member of this gang" });
    }
    
    // Determine new role
    let newRank = "Soldier";
    switch (targetMembership.role) {
      case "Underboss":
        newRank = "Capo";
        break;
      case "Capo":
        newRank = "Soldier";
        break;
      case "Soldier":
        // Can't demote below Soldier
        return res.status(400).json({ message: "Cannot demote below Soldier" });
      default:
        newRank = "Soldier";
    }
    
    // Update role
    const updatedMember = await gangStorage.updateMemberRole(targetUserId, gangId, newRank);
    if (!updatedMember) {
      return res.status(500).json({ message: "Failed to demote member" });
    }
    
    res.json({ message: `Successfully demoted to ${newRank}`, member: updatedMember });
  } catch (error) {
    console.error("Error demoting gang member:", error);
    res.status(500).json({ message: "Failed to demote gang member" });
  }
});

/**
 * Transfer leadership
 * POST /api/gangs/:id/transfer-leadership/:userId
 */
gangRouter.post("/:id/transfer-leadership/:userId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    
    if (isNaN(gangId) || isNaN(targetUserId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }
    
    // Check if user is the leader of this gang
    const userMembership = await gangStorage.getGangMember(req.user.id);
    if (!userMembership || userMembership.gangId !== gangId || userMembership.role !== "Leader") {
      return res.status(403).json({ message: "Only the gang leader can transfer leadership" });
    }
    
    // Check if target user is in this gang
    const targetMembership = await gangStorage.getGangMember(targetUserId);
    if (!targetMembership || targetMembership.gangId !== gangId) {
      return res.status(404).json({ message: "Target user is not a member of this gang" });
    }
    
    // Update roles in a transaction
    try {
      // Begin transaction
      await storage.db.execute(sql`BEGIN`);
      
      // Demote current leader to Underboss
      await gangStorage.updateMemberRole(req.user.id, gangId, "Underboss");
      
      // Promote target to Leader
      await gangStorage.updateMemberRole(targetUserId, gangId, "Leader");
      
      // Update gang owner
      await gangStorage.updateGang(gangId, { ownerId: targetUserId });
      
      // Commit transaction
      await storage.db.execute(sql`COMMIT`);
      
      res.json({ message: "Leadership transferred successfully" });
    } catch (error) {
      // Rollback on error
      await storage.db.execute(sql`ROLLBACK`);
      throw error;
    }
  } catch (error) {
    console.error("Error transferring leadership:", error);
    res.status(500).json({ message: "Failed to transfer leadership" });
  }
});

// GANG BANK ROUTES

/**
 * Deposit money to gang bank
 * POST /api/gangs/:id/bank/deposit
 */
gangRouter.post("/:id/bank/deposit", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    const { amount } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    
    // Check if user is in this gang
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership || membership.gangId !== gangId) {
      return res.status(403).json({ message: "You are not a member of this gang" });
    }
    
    // Check if user has enough cash
    if (req.user.cash < amount) {
      return res.status(400).json({ message: "Not enough cash" });
    }
    
    // Update gang bank balance
    const gang = await gangStorage.getGang(gangId);
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    const updatedGang = await gangStorage.updateGang(gangId, {
      bankBalance: gang.bankBalance + amount
    });
    
    // Update user cash
    const updatedUser = await storage.updateUser(req.user.id, {
      cash: req.user.cash - amount
    });
    
    // Update member contribution
    await gangStorage.updateMemberContribution(req.user.id, gangId, amount);
    
    res.json({ 
      gangBalance: updatedGang.bankBalance,
      userCash: updatedUser.cash,
      contribution: membership.contribution + amount
    });
  } catch (error) {
    console.error("Error depositing to gang bank:", error);
    res.status(500).json({ message: "Failed to deposit to gang bank" });
  }
});

/**
 * Withdraw money from gang bank
 * POST /api/gangs/:id/bank/withdraw
 */
gangRouter.post("/:id/bank/withdraw", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    const { amount } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    
    // Check if user is in this gang with appropriate rank
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership || membership.gangId !== gangId) {
      return res.status(403).json({ message: "You are not a member of this gang" });
    }
    
    if (membership.role !== "Leader" && membership.role !== "Underboss") {
      return res.status(403).json({ 
        message: "Only Leaders and Underbosses can withdraw from the gang bank" 
      });
    }
    
    // Check if gang has enough money
    const gang = await gangStorage.getGang(gangId);
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    if (gang.bankBalance < amount) {
      return res.status(400).json({ message: "Not enough money in gang bank" });
    }
    
    // Update gang bank balance
    const updatedGang = await gangStorage.updateGang(gangId, {
      bankBalance: gang.bankBalance - amount
    });
    
    // Update user cash
    const updatedUser = await storage.updateUser(req.user.id, {
      cash: req.user.cash + amount
    });
    
    res.json({ 
      gangBalance: updatedGang.bankBalance,
      userCash: updatedUser.cash
    });
  } catch (error) {
    console.error("Error withdrawing from gang bank:", error);
    res.status(500).json({ message: "Failed to withdraw from gang bank" });
  }
});

// TERRITORY ROUTES

/**
 * Get all territories
 * GET /api/gangs/territories
 */
gangRouter.get("/territories", async (req: Request, res: Response) => {
  try {
    console.log("Fetching all territories");
    
    // Add user context for better debugging
    if (req.user) {
      console.log("User requesting territories:", req.user.id, req.user.username);
      console.log("User gangId:", req.user.gangId);
    } else {
      console.log("No authenticated user for territories request");
    }
    
    // Make sure we have valid data even if the storage method fails
    let territories;
    try {
      territories = await gangStorage.getAllTerritories();
      console.log("Retrieved territories from storage:", territories);
    } catch (storageError) {
      console.error("Error using storage method for territories:", storageError);
      
      // Fallback to direct SQL query if storage method fails
      try {
        const result = await db.execute(sql`
          SELECT * FROM gang_territories
        `);
        territories = result.rows.map(row => ({
          id: row.id,
          name: row.name || "Unknown Territory",
          description: row.description,
          controlledBy: row.controlled_by || row.controlledBy,
          income: row.income || 0,
          defenseBonus: row.defense_bonus || row.defenseBonus || 0,
          image: row.image,
          attackCooldown: row.attack_cooldown || row.attackCooldown
        }));
        console.log("Retrieved territories from direct SQL:", territories);
      } catch (sqlError) {
        console.error("Error with direct SQL for territories:", sqlError);
        territories = []; // Empty array as last resort
      }
    }
    
    // Default to empty array if we still don't have valid data
    territories = territories || [];
    
    // Modify the response to include the gang name for each controlled territory
    const territoriesWithGangData = await Promise.all(
      territories.map(async (territory) => {
        if (territory.controlledBy) {
          try {
            const gang = await gangStorage.getGang(territory.controlledBy);
            return {
              ...territory,
              controllingGang: gang ? {
                id: gang.id,
                name: gang.name,
                tag: gang.tag
              } : null
            };
          } catch (err) {
            console.error(`Error fetching gang ${territory.controlledBy} for territory ${territory.id}:`, err);
            return territory;
          }
        }
        return territory;
      })
    );
    
    res.json(territoriesWithGangData);
  } catch (error) {
    console.error("Error fetching territories:", error);
    res.status(500).json({ message: "Failed to fetch territories" });
  }
});

/**
 * Get a specific territory
 * GET /api/gangs/territories/:id
 */
gangRouter.get("/territories/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid territory ID" });
    }
    
    console.log(`Fetching specific territory with ID ${id}`);
    
    // Add user context for better debugging
    if (req.user) {
      console.log(`User requesting territory ${id}:`, req.user.id, req.user.username);
      console.log("User gangId:", req.user.gangId);
    }
    
    // Try to get the territory details - use fallbacks if the main method fails
    let territory;
    try {
      territory = await gangStorage.getTerritoryWithDetails(id);
      console.log(`Retrieved territory ${id} from storage:`, territory);
    } catch (storageError) {
      console.error(`Error using storage method for territory ${id}:`, storageError);
      
      // Fallback to direct SQL query if storage method fails
      try {
        const result = await db.execute(sql`
          SELECT * FROM gang_territories WHERE id = ${id}
        `);
        
        if (result.rows.length > 0) {
          const row = result.rows[0];
          territory = {
            id: row.id,
            name: row.name || "Unknown Territory",
            description: row.description,
            controlledBy: row.controlled_by || row.controlledBy,
            income: row.income || 0,
            defenseBonus: row.defense_bonus || row.defenseBonus || 0,
            image: row.image,
            attackCooldown: row.attack_cooldown || row.attackCooldown
          };
          
          // If the territory is controlled by a gang, get the gang details
          if (territory.controlledBy) {
            try {
              const gangResult = await db.execute(sql`
                SELECT * FROM gangs WHERE id = ${territory.controlledBy}
              `);
              
              if (gangResult.rows.length > 0) {
                const gang = gangResult.rows[0];
                territory.controllingGang = {
                  id: gang.id,
                  name: gang.name,
                  tag: gang.tag || gang.name.substring(0, 3).toUpperCase()
                };
              }
            } catch (gangError) {
              console.error(`Error fetching controlling gang for territory ${id}:`, gangError);
            }
          }
          
          console.log(`Retrieved territory ${id} from direct SQL:`, territory);
        }
      } catch (sqlError) {
        console.error(`Error with direct SQL for territory ${id}:`, sqlError);
      }
    }
    
    if (!territory) {
      return res.status(404).json({ message: "Territory not found" });
    }
    
    res.json(territory);
  } catch (error) {
    console.error("Error fetching territory:", error);
    res.status(500).json({ message: "Failed to fetch territory details" });
  }
});

/**
 * Attack a territory
 * POST /api/gangs/territories/:id/attack
 */
gangRouter.post("/territories/:id/attack", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const territoryId = parseInt(req.params.id);
    if (isNaN(territoryId)) {
      return res.status(400).json({ message: "Invalid territory ID" });
    }
    
    // Check if user is in a gang with appropriate role
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You must be in a gang to attack territories" });
    }
    
    if (membership.role !== "Leader" && membership.role !== "Underboss") {
      return res.status(403).json({ 
        message: "Only Leaders and Underbosses can initiate territory attacks" 
      });
    }
    
    // Check if territory exists
    const territory = await gangStorage.getTerritory(territoryId);
    if (!territory) {
      return res.status(404).json({ message: "Territory not found" });
    }
    
    // Check if territory has a cooldown
    if (territory.attackCooldown && territory.attackCooldown > new Date()) {
      const cooldownTime = territory.attackCooldown.getTime() - Date.now();
      const cooldownHours = Math.ceil(cooldownTime / (1000 * 60 * 60));
      
      return res.status(400).json({ 
        message: `This territory cannot be attacked for another ${cooldownHours} hours` 
      });
    }
    
    // Check if territory is already controlled by this gang
    if (territory.controlledBy === membership.gangId) {
      return res.status(400).json({ message: "Your gang already controls this territory" });
    }
    
    // If territory is controlled by another gang, start a war
    if (territory.controlledBy) {
      // Check for existing wars between these gangs
      const activeWars = await gangStorage.getActiveGangWars();
      const existingWar = activeWars.find(
        war => 
          (war.attackerId === membership.gangId && war.defenderId === territory.controlledBy) ||
          (war.attackerId === territory.controlledBy && war.defenderId === membership.gangId)
      );
      
      if (existingWar) {
        return res.status(400).json({ 
          message: "There is already an active war between these gangs" 
        });
      }
      
      // Create a new gang war
      const war = await gangStorage.createGangWar({
        attackerId: membership.gangId,
        defenderId: territory.controlledBy,
        territoryId,
        status: "active",
        startTime: new Date()
      });
      
      // Add the user as a participant
      await gangStorage.addGangWarParticipant({
        warId: war.id,
        userId: req.user.id,
        gangId: membership.gangId
      });
      
      res.json({ 
        message: "War started for territory control", 
        war 
      });
    } else {
      // If territory is unclaimed, take it immediately
      const updatedTerritory = await gangStorage.changeTerritoryControl(territoryId, membership.gangId);
      
      res.json({ 
        message: "Territory claimed successfully", 
        territory: updatedTerritory 
      });
    }
  } catch (error) {
    console.error("Error attacking territory:", error);
    res.status(500).json({ message: "Failed to attack territory" });
  }
});

// GANG WAR ROUTES

/**
 * Get all gang wars
 * GET /api/gangs/wars
 */
gangRouter.get("/wars", async (req: Request, res: Response) => {
  try {
    const wars = await gangStorage.getAllGangWars();
    res.json(wars);
  } catch (error) {
    console.error("Error fetching gang wars:", error);
    res.status(500).json({ message: "Failed to fetch gang wars" });
  }
});

/**
 * Get active gang wars
 * GET /api/gangs/wars/active
 */
gangRouter.get("/wars/active", async (req: Request, res: Response) => {
  try {
    const wars = await gangStorage.getActiveGangWars();
    res.json(wars);
  } catch (error) {
    console.error("Error fetching active gang wars:", error);
    res.status(500).json({ message: "Failed to fetch active gang wars" });
  }
});

/**
 * Get a specific gang war
 * GET /api/gangs/wars/:id
 */
gangRouter.get("/wars/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid war ID" });
    }
    
    const war = await gangStorage.getGangWar(id);
    if (!war) {
      return res.status(404).json({ message: "Gang war not found" });
    }
    
    res.json(war);
  } catch (error) {
    console.error("Error fetching gang war:", error);
    res.status(500).json({ message: "Failed to fetch gang war details" });
  }
});

/**
 * Join a gang war
 * POST /api/gangs/wars/:id/join
 */
gangRouter.post("/wars/:id/join", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const warId = parseInt(req.params.id);
    if (isNaN(warId)) {
      return res.status(400).json({ message: "Invalid war ID" });
    }
    
    // Check if war exists and is active
    const war = await gangStorage.getGangWar(warId);
    if (!war) {
      return res.status(404).json({ message: "Gang war not found" });
    }
    
    if (war.status !== "active") {
      return res.status(400).json({ message: "This war is no longer active" });
    }
    
    // Check if user is in one of the gangs involved
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You must be in a gang to join a war" });
    }
    
    if (membership.gangId !== war.attackerId && membership.gangId !== war.defenderId) {
      return res.status(403).json({ 
        message: "You can only join wars that involve your gang" 
      });
    }
    
    // Check if user is already participating
    const existingParticipation = await gangStorage.getGangWarParticipant(req.user.id, warId);
    if (existingParticipation) {
      return res.status(400).json({ message: "You are already participating in this war" });
    }
    
    // Add user as a participant
    const participant = await gangStorage.addGangWarParticipant({
      warId,
      userId: req.user.id,
      gangId: membership.gangId
    });
    
    res.status(201).json(participant);
  } catch (error) {
    console.error("Error joining gang war:", error);
    res.status(500).json({ message: "Failed to join gang war" });
  }
});

/**
 * Contribute to a gang war
 * POST /api/gangs/wars/:id/contribute
 */
gangRouter.post("/wars/:id/contribute", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const warId = parseInt(req.params.id);
    if (isNaN(warId)) {
      return res.status(400).json({ message: "Invalid war ID" });
    }
    
    const { amount } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    
    // Check if user is participating in this war
    const participant = await gangStorage.getGangWarParticipant(req.user.id, warId);
    if (!participant) {
      return res.status(403).json({ message: "You are not participating in this war" });
    }
    
    // Check if war is still active
    const war = await gangStorage.getGangWar(warId);
    if (!war || war.status !== "active") {
      return res.status(400).json({ message: "This war is no longer active" });
    }
    
    // Check if user has enough cash
    if (req.user.cash < amount) {
      return res.status(400).json({ message: "Not enough cash" });
    }
    
    // Update user cash
    const updatedUser = await storage.updateUser(req.user.id, {
      cash: req.user.cash - amount
    });
    
    // Update war contribution
    const updatedParticipant = await gangStorage.updateWarParticipantContribution(req.user.id, warId, amount);
    
    // Update gang member contribution
    await gangStorage.updateMemberContribution(req.user.id, participant.gangId, amount);
    
    // Check if war should end (if one side has a significant advantage)
    const updatedWar = await gangStorage.getGangWar(warId);
    let warEnded = false;
    
    if (updatedWar.attackStrength > updatedWar.defenseStrength * 2) {
      // Attacker has overwhelming advantage
      await gangStorage.endGangWar(warId, updatedWar.attackerId);
      warEnded = true;
    } else if (updatedWar.defenseStrength > updatedWar.attackStrength * 2) {
      // Defender has overwhelming advantage
      await gangStorage.endGangWar(warId, updatedWar.defenderId);
      warEnded = true;
    }
    
    res.json({
      message: warEnded ? "War has ended due to overwhelming force" : "Contribution added successfully",
      userCash: updatedUser.cash,
      contribution: updatedParticipant.contribution,
      warStatus: warEnded ? "completed" : "active"
    });
  } catch (error) {
    console.error("Error contributing to gang war:", error);
    res.status(500).json({ message: "Failed to contribute to gang war" });
  }
});

// GANG MISSION ROUTES

/**
 * Get all gang missions
 * GET /api/gangs/missions
 */
gangRouter.get("/missions", isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log("Fetching missions for user ID:", req.user?.id);
    
    // Check if user is in a gang - use raw SQL query for more reliable results
    let membership;
    try {
      // First check using the storage method
      membership = await gangStorage.getGangMember(req.user.id);
      console.log("GangMember result from storage method:", membership);
      
      // If that fails, check using direct SQL
      if (!membership) {
        const result = await db.execute(sql`
          SELECT gm.*, u.gang_id FROM gang_members gm
          JOIN users u ON u.id = gm.user_id
          WHERE gm.user_id = ${req.user.id}
        `);
        
        if (result.rows.length > 0) {
          console.log("GangMember result from direct SQL:", result.rows[0]);
          membership = {
            id: result.rows[0].id,
            gangId: result.rows[0].gang_id || result.rows[0].gangId,
            userId: result.rows[0].user_id || result.rows[0].userId,
            role: result.rows[0].role || result.rows[0].rank,
            joinedAt: result.rows[0].joined_at || result.rows[0].joinedAt
          };
        }
      }
    } catch (membershipError) {
      console.error("Error checking gang membership:", membershipError);
    }
    
    // Check directly on the user object as a fallback
    const gangId = membership?.gangId || req.user.gangId;
    console.log("Determined gangId:", gangId);
    
    if (!gangId) {
      return res.status(403).json({ message: "You must be in a gang to view missions" });
    }
    
    // Get all available missions for this gang
    const missions = await gangStorage.getAvailableMissionsForGang(gangId);
    console.log("Retrieved missions for gang:", missions);
    
    res.json(missions || []);
  } catch (error) {
    console.error("Error fetching gang missions:", error);
    res.status(500).json({ message: "Failed to fetch gang missions" });
  }
});

/**
 * Start a gang mission
 * POST /api/gangs/missions/:id/start
 */
gangRouter.post("/missions/:id/start", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const missionId = parseInt(req.params.id);
    if (isNaN(missionId)) {
      return res.status(400).json({ message: "Invalid mission ID" });
    }
    
    // Check if user is in a gang with appropriate role
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You must be in a gang to start missions" });
    }
    
    if (membership.role !== "Leader" && membership.role !== "Underboss" && membership.role !== "Capo") {
      return res.status(403).json({ 
        message: "Only Leaders, Underbosses and Capos can start gang missions" 
      });
    }
    
    // Get the mission
    const mission = await gangStorage.getGangMission(missionId);
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }
    
    // Check if gang has enough members for this mission
    const memberCount = await gangStorage.getGangMemberCount(membership.gangId);
    if (memberCount < mission.requiredMembers) {
      return res.status(400).json({ 
        message: `This mission requires at least ${mission.requiredMembers} gang members` 
      });
    }
    
    // Check if mission is already in progress or on cooldown
    const availableMissions = await gangStorage.getAvailableMissionsForGang(membership.gangId);
    const missionInfo = availableMissions.find(m => m.id === missionId);
    
    if (!missionInfo) {
      return res.status(400).json({ message: "Mission not available" });
    }
    
    if (!missionInfo.canAttempt) {
      if (missionInfo.onCooldown) {
        return res.status(400).json({ 
          message: "This mission is on cooldown", 
          cooldownEnds: missionInfo.cooldownEnds
        });
      }
      
      return res.status(400).json({ message: "This mission cannot be attempted at this time" });
    }
    
    // Start the mission
    const attempt = await gangStorage.startMissionAttempt(membership.gangId, missionId);
    if (!attempt) {
      return res.status(500).json({ message: "Failed to start mission" });
    }
    
    res.json({
      message: "Mission started successfully",
      attempt,
      completesAt: attempt.completedAt
    });
  } catch (error) {
    console.error("Error starting gang mission:", error);
    res.status(500).json({ message: "Failed to start gang mission" });
  }
});

/**
 * Check mission status
 * GET /api/gangs/missions/attempts/:id
 */
gangRouter.get("/missions/attempts/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.id);
    if (isNaN(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID" });
    }
    
    // Check mission completion
    const { complete, attempt, mission } = await gangStorage.checkMissionCompletion(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: "Mission attempt not found" });
    }
    
    // Check if user is in the gang that's doing this mission
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership || membership.gangId !== attempt.gangId) {
      return res.status(403).json({ message: "You are not a member of the gang doing this mission" });
    }
    
    res.json({
      complete,
      attempt,
      mission,
      canCollect: complete && attempt.status === "completed"
    });
  } catch (error) {
    console.error("Error checking mission status:", error);
    res.status(500).json({ message: "Failed to check mission status" });
  }
});

/**
 * Collect mission rewards
 * POST /api/gangs/missions/attempts/:id/collect
 */
gangRouter.post("/missions/attempts/:id/collect", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.id);
    if (isNaN(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID" });
    }
    
    // Check if mission is complete
    const { complete, attempt } = await gangStorage.checkMissionCompletion(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: "Mission attempt not found" });
    }
    
    // Check if user is in the gang with appropriate rank
    const membership = await gangStorage.getGangMember(req.user.id);
    if (!membership || membership.gangId !== attempt.gangId) {
      return res.status(403).json({ message: "You are not a member of the gang doing this mission" });
    }
    
    if (membership.role !== "Leader" && membership.role !== "Underboss") {
      return res.status(403).json({ 
        message: "Only Leaders and Underbosses can collect mission rewards" 
      });
    }
    
    if (!complete) {
      return res.status(400).json({ message: "Mission not complete yet" });
    }
    
    if (attempt.status !== "completed") {
      return res.status(400).json({ message: "Mission rewards already collected" });
    }
    
    // Collect rewards
    const result = await gangStorage.collectMissionRewards(attemptId);
    
    if (!result.success) {
      return res.status(400).json({ message: result.error || "Failed to collect rewards" });
    }
    
    res.json({
      message: "Mission rewards collected successfully",
      rewards: result.rewards
    });
  } catch (error) {
    console.error("Error collecting mission rewards:", error);
    res.status(500).json({ message: "Failed to collect mission rewards" });
  }
});

// Export the router
export default gangRouter;