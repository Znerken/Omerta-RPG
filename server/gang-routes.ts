import { Router } from "express";
import { storage } from "./storage";
import { insertGangSchema, insertGangMemberSchema, insertGangTerritorySchema, insertGangWarSchema, insertGangWarParticipantSchema, insertGangMissionAttemptSchema } from "@shared/schema";
import { ZodError } from "zod";

const gangRouter = Router();

// Gang routes
gangRouter.get("/", async (req, res) => {
  try {
    const gangs = await storage.getAllGangs();
    res.json(gangs);
  } catch (error) {
    console.error("Error fetching gangs:", error);
    res.status(500).json({ message: "Failed to fetch gangs" });
  }
});

gangRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    const gang = await storage.getGangWithDetails(id);
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    res.json(gang);
  } catch (error) {
    console.error("Error fetching gang:", error);
    res.status(500).json({ message: "Failed to fetch gang details" });
  }
});

gangRouter.post("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    // Check if user is already in a gang
    const existingMembership = await storage.getGangMember(req.user.id);
    if (existingMembership) {
      return res.status(400).json({ 
        message: "You are already a member of a gang" 
      });
    }
    
    // Validate request body against schema
    const gangData = insertGangSchema.parse(req.body);
    
    // Check gang name and tag uniqueness
    const existingGangByName = await storage.getGangByName(gangData.name);
    if (existingGangByName) {
      return res.status(400).json({ message: "Gang name already taken" });
    }
    
    const existingGangByTag = await storage.getGangByTag(gangData.tag);
    if (existingGangByTag) {
      return res.status(400).json({ message: "Gang tag already taken" });
    }
    
    // Create the gang
    const newGang = await storage.createGang({
      ...gangData,
      founderUserId: req.user.id,
      respect: 0,
      bankBalance: 0,
      createdAt: new Date()
    });
    
    // Add founder as a member with leader rank
    await storage.addGangMember({
      gangId: newGang.id,
      userId: req.user.id,
      rank: "Leader",
      contribution: 0
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

gangRouter.post("/:id/join", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    // Check if user is already in a gang
    const existingMembership = await storage.getGangMember(req.user.id);
    if (existingMembership) {
      return res.status(400).json({ 
        message: "You are already a member of a gang" 
      });
    }
    
    // Check if gang exists
    const gang = await storage.getGang(gangId);
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    // Add user as a member with the default "Member" rank
    const gangMember = await storage.addGangMember({
      gangId,
      userId: req.user.id,
      rank: "Member",
      contribution: 0
    });
    
    res.status(201).json(gangMember);
  } catch (error) {
    console.error("Error joining gang:", error);
    res.status(500).json({ message: "Failed to join gang" });
  }
});

gangRouter.post("/:id/leave", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    const gangId = parseInt(req.params.id);
    if (isNaN(gangId)) {
      return res.status(400).json({ message: "Invalid gang ID" });
    }
    
    // Check if user is in this gang
    const existingMembership = await storage.getGangMember(req.user.id);
    if (!existingMembership || existingMembership.gang.id !== gangId) {
      return res.status(400).json({ 
        message: "You are not a member of this gang" 
      });
    }
    
    // Leaders can't leave unless they're the only member
    if (existingMembership.rank === "Leader") {
      const memberCount = await storage.getGangMemberCount(gangId);
      if (memberCount > 1) {
        return res.status(400).json({ 
          message: "Leaders must promote another member before leaving" 
        });
      }
    }
    
    // Remove user from gang
    const success = await storage.removeGangMember(req.user.id, gangId);
    if (!success) {
      return res.status(500).json({ message: "Failed to leave gang" });
    }
    
    res.json({ message: "You have left the gang" });
  } catch (error) {
    console.error("Error leaving gang:", error);
    res.status(500).json({ message: "Failed to leave gang" });
  }
});

gangRouter.post("/:id/bank/deposit", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
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
    const existingMembership = await storage.getGangMember(req.user.id);
    if (!existingMembership || existingMembership.gang.id !== gangId) {
      return res.status(400).json({ 
        message: "You are not a member of this gang" 
      });
    }
    
    // Check if user has enough cash
    if (req.user.cash < amount) {
      return res.status(400).json({ message: "Not enough cash" });
    }
    
    // Update gang bank balance
    const gang = await storage.getGang(gangId);
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    const updatedGang = await storage.updateGang(gangId, {
      bankBalance: gang.bankBalance + amount
    });
    
    // Update user cash
    const updatedUser = await storage.updateUser(req.user.id, {
      cash: req.user.cash - amount
    });
    
    // Update member contribution
    await storage.updateMemberContribution(req.user.id, gangId, amount);
    
    res.json({ 
      gangBalance: updatedGang!.bankBalance,
      userCash: updatedUser!.cash 
    });
  } catch (error) {
    console.error("Error depositing to gang bank:", error);
    res.status(500).json({ message: "Failed to deposit to gang bank" });
  }
});

gangRouter.post("/:id/bank/withdraw", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
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
    const existingMembership = await storage.getGangMember(req.user.id);
    if (!existingMembership || existingMembership.gang.id !== gangId) {
      return res.status(400).json({ 
        message: "You are not a member of this gang" 
      });
    }
    
    if (existingMembership.rank !== "Leader" && existingMembership.rank !== "Underboss") {
      return res.status(403).json({ 
        message: "Only Leaders and Underbosses can withdraw from the gang bank" 
      });
    }
    
    // Check if gang has enough money
    const gang = await storage.getGang(gangId);
    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }
    
    if (gang.bankBalance < amount) {
      return res.status(400).json({ message: "Not enough money in gang bank" });
    }
    
    // Update gang bank balance
    const updatedGang = await storage.updateGang(gangId, {
      bankBalance: gang.bankBalance - amount
    });
    
    // Update user cash
    const updatedUser = await storage.updateUser(req.user.id, {
      cash: req.user.cash + amount
    });
    
    res.json({ 
      gangBalance: updatedGang!.bankBalance,
      userCash: updatedUser!.cash 
    });
  } catch (error) {
    console.error("Error withdrawing from gang bank:", error);
    res.status(500).json({ message: "Failed to withdraw from gang bank" });
  }
});

// Territory routes
gangRouter.get("/territories", async (req, res) => {
  try {
    const territories = await storage.getAllTerritories();
    res.json(territories);
  } catch (error) {
    console.error("Error fetching territories:", error);
    res.status(500).json({ message: "Failed to fetch territories" });
  }
});

gangRouter.get("/territories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid territory ID" });
    }
    
    const territory = await storage.getTerritoryWithDetails(id);
    if (!territory) {
      return res.status(404).json({ message: "Territory not found" });
    }
    
    res.json(territory);
  } catch (error) {
    console.error("Error fetching territory:", error);
    res.status(500).json({ message: "Failed to fetch territory details" });
  }
});

// Gang War routes
gangRouter.get("/wars", async (req, res) => {
  try {
    const wars = await storage.getAllGangWars();
    res.json(wars);
  } catch (error) {
    console.error("Error fetching gang wars:", error);
    res.status(500).json({ message: "Failed to fetch gang wars" });
  }
});

gangRouter.get("/wars/active", async (req, res) => {
  try {
    const wars = await storage.getActiveGangWars();
    res.json(wars);
  } catch (error) {
    console.error("Error fetching active gang wars:", error);
    res.status(500).json({ message: "Failed to fetch active gang wars" });
  }
});

gangRouter.get("/wars/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid war ID" });
    }
    
    const war = await storage.getGangWarWithDetails(id);
    if (!war) {
      return res.status(404).json({ message: "Gang war not found" });
    }
    
    res.json(war);
  } catch (error) {
    console.error("Error fetching gang war:", error);
    res.status(500).json({ message: "Failed to fetch gang war details" });
  }
});

gangRouter.post("/wars", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    // Validate request body against schema
    const warData = insertGangWarSchema.parse(req.body);
    
    // Check if user is in the attacker gang with appropriate rank
    const membership = await storage.getGangMember(req.user.id);
    if (!membership || membership.gang.id !== warData.attackerGangId) {
      return res.status(403).json({ 
        message: "You must be a member of the attacking gang" 
      });
    }
    
    if (membership.rank !== "Leader" && membership.rank !== "Underboss") {
      return res.status(403).json({ 
        message: "Only Leaders and Underbosses can declare war" 
      });
    }
    
    // Check if attacker gang exists
    const attackerGang = await storage.getGang(warData.attackerGangId);
    if (!attackerGang) {
      return res.status(404).json({ message: "Attacker gang not found" });
    }
    
    // Check if defender gang exists
    const defenderGang = await storage.getGang(warData.defenderGangId);
    if (!defenderGang) {
      return res.status(404).json({ message: "Defender gang not found" });
    }
    
    // Check if there's already an active war between these gangs
    const activeWars = await storage.getActiveGangWars();
    const existingWar = activeWars.find(
      war => 
        (war.attackerGangId === warData.attackerGangId && war.defenderGangId === warData.defenderGangId) ||
        (war.attackerGangId === warData.defenderGangId && war.defenderGangId === warData.attackerGangId)
    );
    
    if (existingWar) {
      return res.status(400).json({ 
        message: "There is already an active war between these gangs" 
      });
    }
    
    // If there's a territory at stake, verify it exists
    if (warData.territoryId) {
      const territory = await storage.getTerritory(warData.territoryId);
      if (!territory) {
        return res.status(404).json({ message: "Territory not found" });
      }
      
      // Verify the defender controls this territory
      if (territory.controlledByGangId !== warData.defenderGangId) {
        return res.status(400).json({ 
          message: "The defending gang does not control this territory" 
        });
      }
    }
    
    // Create the gang war
    const gangWar = await storage.createGangWar(warData);
    
    // Automatically add the declaring user as a participant
    await storage.addGangWarParticipant({
      warId: gangWar.id,
      userId: req.user.id,
      gangId: warData.attackerGangId
    });
    
    res.status(201).json(gangWar);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Invalid gang war data", 
        errors: error.errors 
      });
    }
    
    console.error("Error creating gang war:", error);
    res.status(500).json({ message: "Failed to create gang war" });
  }
});

gangRouter.post("/wars/:id/join", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    const warId = parseInt(req.params.id);
    if (isNaN(warId)) {
      return res.status(400).json({ message: "Invalid war ID" });
    }
    
    // Check if war exists and is active
    const war = await storage.getGangWar(warId);
    if (!war) {
      return res.status(404).json({ message: "Gang war not found" });
    }
    
    if (war.status !== "active") {
      return res.status(400).json({ message: "This war is no longer active" });
    }
    
    // Check if user is in one of the gangs involved
    const membership = await storage.getGangMember(req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You must be in a gang to join a war" });
    }
    
    if (membership.gang.id !== war.attackerGangId && membership.gang.id !== war.defenderGangId) {
      return res.status(403).json({ 
        message: "You can only join wars that involve your gang" 
      });
    }
    
    // Check if user is already participating
    const existingParticipation = await storage.getGangWarParticipant(req.user.id, warId);
    if (existingParticipation) {
      return res.status(400).json({ message: "You are already participating in this war" });
    }
    
    // Add user as a participant
    const participant = await storage.addGangWarParticipant({
      warId,
      userId: req.user.id,
      gangId: membership.gang.id
    });
    
    res.status(201).json(participant);
  } catch (error) {
    console.error("Error joining gang war:", error);
    res.status(500).json({ message: "Failed to join gang war" });
  }
});

gangRouter.post("/wars/:id/contribute", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    const warId = parseInt(req.params.id);
    if (isNaN(warId)) {
      return res.status(400).json({ message: "Invalid war ID" });
    }
    
    const { amount } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid contribution amount" });
    }
    
    // Check if war exists and is active
    const war = await storage.getGangWar(warId);
    if (!war) {
      return res.status(404).json({ message: "Gang war not found" });
    }
    
    if (war.status !== "active") {
      return res.status(400).json({ message: "This war is no longer active" });
    }
    
    // Check if user is a participant
    const participant = await storage.getGangWarParticipant(req.user.id, warId);
    if (!participant) {
      return res.status(403).json({ 
        message: "You must join this war before contributing" 
      });
    }
    
    // Update war scores based on which gang the user is in
    const isAttacker = participant.gangId === war.attackerGangId;
    const updatedWar = await storage.updateGangWar(warId, {
      attackerScore: isAttacker ? war.attackerScore + amount : war.attackerScore,
      defenderScore: !isAttacker ? war.defenderScore + amount : war.defenderScore
    });
    
    // Update participant contribution
    const updatedParticipant = await storage.updateGangWarParticipant(
      req.user.id, 
      warId, 
      { contribution: participant.contribution + amount }
    );
    
    res.json({ 
      war: updatedWar,
      participant: updatedParticipant
    });
  } catch (error) {
    console.error("Error contributing to gang war:", error);
    res.status(500).json({ message: "Failed to contribute to gang war" });
  }
});

// Gang Mission routes
gangRouter.get("/missions", async (req, res) => {
  try {
    const missions = await storage.getAllGangMissions();
    res.json(missions);
  } catch (error) {
    console.error("Error fetching gang missions:", error);
    res.status(500).json({ message: "Failed to fetch gang missions" });
  }
});

gangRouter.get("/missions/active", async (req, res) => {
  try {
    const missions = await storage.getActiveMissions();
    res.json(missions);
  } catch (error) {
    console.error("Error fetching active gang missions:", error);
    res.status(500).json({ message: "Failed to fetch active gang missions" });
  }
});

gangRouter.get("/missions/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    const missionId = parseInt(req.params.id);
    if (isNaN(missionId)) {
      return res.status(400).json({ message: "Invalid mission ID" });
    }
    
    // Get user's gang
    const membership = await storage.getGangMember(req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You must be in a gang to view mission details" });
    }
    
    const missionWithDetails = await storage.getGangMissionWithDetails(missionId, membership.gang.id);
    if (!missionWithDetails) {
      return res.status(404).json({ message: "Gang mission not found" });
    }
    
    res.json(missionWithDetails);
  } catch (error) {
    console.error("Error fetching gang mission:", error);
    res.status(500).json({ message: "Failed to fetch gang mission details" });
  }
});

gangRouter.post("/missions/:id/start", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    const missionId = parseInt(req.params.id);
    if (isNaN(missionId)) {
      return res.status(400).json({ message: "Invalid mission ID" });
    }
    
    // Check if mission exists and is active
    const mission = await storage.getGangMission(missionId);
    if (!mission) {
      return res.status(404).json({ message: "Gang mission not found" });
    }
    
    if (!mission.isActive) {
      return res.status(400).json({ message: "This mission is not currently active" });
    }
    
    // Check if user is in a gang with appropriate rank
    const membership = await storage.getGangMember(req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You must be in a gang to start a mission" });
    }
    
    if (membership.rank !== "Leader" && membership.rank !== "Underboss") {
      return res.status(403).json({ 
        message: "Only Leaders and Underbosses can start gang missions" 
      });
    }
    
    const gangId = membership.gang.id;
    
    // Check if the gang is already on this mission
    const existingAttempt = await storage.getGangMissionAttempt(gangId, missionId);
    if (existingAttempt) {
      return res.status(400).json({ 
        message: "Your gang is already working on this mission" 
      });
    }
    
    // Check if the gang can attempt this mission (cooldown checks)
    const missionDetails = await storage.getGangMissionWithDetails(missionId, gangId);
    if (!missionDetails?.canAttempt) {
      return res.status(400).json({ 
        message: "Your gang cannot attempt this mission right now" 
      });
    }
    
    // Start the mission attempt
    const attempt = await storage.startGangMissionAttempt({
      gangId,
      missionId
    });
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error("Error starting gang mission:", error);
    res.status(500).json({ message: "Failed to start gang mission" });
  }
});

gangRouter.post("/missions/:id/progress", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  
  try {
    const missionId = parseInt(req.params.id);
    if (isNaN(missionId)) {
      return res.status(400).json({ message: "Invalid mission ID" });
    }
    
    const { contribution } = req.body;
    if (!contribution || typeof contribution !== "number" || contribution <= 0) {
      return res.status(400).json({ message: "Invalid contribution amount" });
    }
    
    // Check if user is in a gang
    const membership = await storage.getGangMember(req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You must be in a gang to contribute to missions" });
    }
    
    const gangId = membership.gang.id;
    
    // Check if the gang is on this mission
    const attempt = await storage.getGangMissionAttempt(gangId, missionId);
    if (!attempt) {
      return res.status(400).json({ 
        message: "Your gang is not currently on this mission" 
      });
    }
    
    if (attempt.isCompleted) {
      return res.status(400).json({ message: "This mission is already completed" });
    }
    
    // Get the mission to calculate new progress
    const mission = await storage.getGangMission(missionId);
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }
    
    // Calculate new progress (cap at 100%)
    const progressIncrement = (contribution / mission.difficultyLevel) * 100;
    const newProgress = Math.min(100, attempt.progress + progressIncrement);
    
    // Update attempt with new progress
    const isCompleted = newProgress >= 100;
    const updatedAttempt = await storage.updateGangMissionAttempt(attempt.id, {
      progress: newProgress,
      isCompleted
    });
    
    // Update member contribution
    await storage.updateMemberContribution(req.user.id, gangId, contribution);
    
    res.json(updatedAttempt);
  } catch (error) {
    console.error("Error progressing gang mission:", error);
    res.status(500).json({ message: "Failed to update mission progress" });
  }
});

export default gangRouter;