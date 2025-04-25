import { Request, Response, Express } from "express";
import { drugStorage } from "./storage-drugs";
import { storage } from "./storage";
import { 
  insertDrugSchema,
  insertDrugIngredientSchema,
  insertDrugRecipeSchema,
  insertUserDrugSchema,
  insertUserIngredientSchema,
  insertDrugLabSchema,
  insertDrugProductionSchema,
  insertDrugDealSchema,
  insertDrugAddictionSchema,
  insertDrugTerritorySchema
} from "@shared/schema";
import { ZodError } from "zod";
import { isAuthenticated, isAdmin } from "./middleware/auth";

// Helper function to handle validation errors
function handleZodError(error: ZodError, res: Response): void {
  const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
  res.status(400).json({ error: errorMessage });
}

/**
 * Register drug routes
 */
export function registerDrugRoutes(app: Express) {
  
  // Initialize default drugs
  drugStorage.initializeDefaultDrugs();

  // ========== Drug CRUD Routes ==========
  app.get("/api/drugs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const drugs = await drugStorage.getAllDrugs();
      res.json(drugs);
    } catch (error) {
      console.error("Error fetching drugs:", error);
      res.status(500).json({ error: "Failed to fetch drugs" });
    }
  });

  app.get("/api/drugs/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const drugId = parseInt(req.params.id);
      const drug = await drugStorage.getDrug(drugId);
      
      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }
      
      res.json(drug);
    } catch (error) {
      console.error("Error fetching drug:", error);
      res.status(500).json({ error: "Failed to fetch drug" });
    }
  });

  app.get("/api/drugs/:id/recipe", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const drugId = parseInt(req.params.id);
      const drugWithRecipe = await drugStorage.getDrugWithRecipe(drugId);
      
      if (!drugWithRecipe) {
        return res.status(404).json({ error: "Drug not found" });
      }
      
      res.json(drugWithRecipe);
    } catch (error) {
      console.error("Error fetching drug recipe:", error);
      res.status(500).json({ error: "Failed to fetch drug recipe" });
    }
  });

  // Admin routes for drug management
  app.post("/api/admin/drugs", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const drugData = insertDrugSchema.parse(req.body);
      const newDrug = await drugStorage.createDrug(drugData);
      res.status(201).json(newDrug);
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodError(error, res);
      } else {
        console.error("Error creating drug:", error);
        res.status(500).json({ error: "Failed to create drug" });
      }
    }
  });

  app.patch("/api/admin/drugs/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const drugId = parseInt(req.params.id);
      const drug = await drugStorage.getDrug(drugId);
      
      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }
      
      const updatedDrug = await drugStorage.updateDrug(drugId, req.body);
      res.json(updatedDrug);
    } catch (error) {
      console.error("Error updating drug:", error);
      res.status(500).json({ error: "Failed to update drug" });
    }
  });

  app.delete("/api/admin/drugs/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const drugId = parseInt(req.params.id);
      const drug = await drugStorage.getDrug(drugId);
      
      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }
      
      await drugStorage.deleteDrug(drugId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting drug:", error);
      res.status(500).json({ error: "Failed to delete drug" });
    }
  });

  // ========== Ingredient CRUD Routes ==========
  app.get("/api/drug-ingredients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ingredients = await drugStorage.getAllDrugIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      res.status(500).json({ error: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/drug-ingredients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ingredientId = parseInt(req.params.id);
      const ingredient = await drugStorage.getDrugIngredient(ingredientId);
      
      if (!ingredient) {
        return res.status(404).json({ error: "Ingredient not found" });
      }
      
      res.json(ingredient);
    } catch (error) {
      console.error("Error fetching ingredient:", error);
      res.status(500).json({ error: "Failed to fetch ingredient" });
    }
  });

  app.post("/api/admin/drug-ingredients", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const ingredientData = insertDrugIngredientSchema.parse(req.body);
      const newIngredient = await drugStorage.createDrugIngredient(ingredientData);
      res.status(201).json(newIngredient);
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodError(error, res);
      } else {
        console.error("Error creating ingredient:", error);
        res.status(500).json({ error: "Failed to create ingredient" });
      }
    }
  });

  // ========== User Inventory Routes ==========
  app.get("/api/user/drugs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userDrugs = await drugStorage.getUserDrugs(userId);
      res.json(userDrugs);
    } catch (error) {
      console.error("Error fetching user drugs:", error);
      res.status(500).json({ error: "Failed to fetch user drugs" });
    }
  });

  app.get("/api/user/ingredients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userIngredients = await drugStorage.getUserIngredients(userId);
      res.json(userIngredients);
    } catch (error) {
      console.error("Error fetching user ingredients:", error);
      res.status(500).json({ error: "Failed to fetch user ingredients" });
    }
  });

  app.post("/api/user/drugs/use/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const drugId = parseInt(req.params.id);
      
      // Check if user has the drug
      const userDrug = await drugStorage.getUserDrug(userId, drugId);
      if (!userDrug) {
        return res.status(404).json({ error: "You don't have this drug" });
      }
      
      // Get drug details
      const drug = await drugStorage.getDrug(drugId);
      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }
      
      // Remove one drug from user's inventory
      await drugStorage.removeDrugFromUser(userId, drugId, 1);
      
      // Update user stats with drug effects
      const user = await storage.getUser(userId);
      const stats = await storage.getStatsByUserId(userId);
      
      if (user && stats) {
        // Calculate addiction chance
        const addictionChance = drug.addictionRate || 0;
        const randomChance = Math.random() * 100;
        let addiction = null;
        
        // Create or update addiction if user gets addicted
        if (randomChance <= addictionChance) {
          const withdrawalEffects = [
            "Increased stress and inability to focus",
            "Trembling hands and reduced coordination",
            "Violent mood swings and aggression",
            "Severe paranoia and hallucinations",
            "Physical weakness and lethargy",
          ];
          const randomEffect = withdrawalEffects[Math.floor(Math.random() * withdrawalEffects.length)];
          
          addiction = await drugStorage.createOrUpdateAddiction(userId, drugId, randomEffect);
        }
        
        // Apply drug bonuses to user stats
        const updatedStats = await storage.updateStats(userId, {
          strength: stats.strength + (drug.strengthBonus || 0),
          stealth: stats.stealth + (drug.stealthBonus || 0),
          charisma: stats.charisma + (drug.charismaBonus || 0),
          intelligence: stats.intelligence + (drug.intelligenceBonus || 0),
        });
        
        // Calculate when the effect will expire
        const expireTime = new Date();
        expireTime.setHours(expireTime.getHours() + (drug.durationHours || 1));
        
        res.json({
          message: `You used ${drug.name}`,
          drugEffect: {
            name: drug.name,
            description: drug.description,
            bonuses: {
              strength: drug.strengthBonus || 0,
              stealth: drug.stealthBonus || 0,
              charisma: drug.charismaBonus || 0,
              intelligence: drug.intelligenceBonus || 0,
              cashGain: drug.cashGainBonus || 0,
            },
            sideEffects: drug.sideEffects,
            expiresAt: expireTime,
          },
          addiction: addiction ? {
            level: addiction.level,
            withdrawalEffect: addiction.withdrawalEffect,
          } : null,
          stats: updatedStats,
        });
      } else {
        res.status(404).json({ error: "User or stats not found" });
      }
    } catch (error) {
      console.error("Error using drug:", error);
      res.status(500).json({ error: "Failed to use drug" });
    }
  });

  app.get("/api/user/addictions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const addictions = await drugStorage.getUserAddictions(userId);
      res.json(addictions);
    } catch (error) {
      console.error("Error fetching addictions:", error);
      res.status(500).json({ error: "Failed to fetch addictions" });
    }
  });

  app.get("/api/user/withdrawal-effects", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const effects = await drugStorage.getWithdrawalEffects(userId);
      res.json(effects);
    } catch (error) {
      console.error("Error fetching withdrawal effects:", error);
      res.status(500).json({ error: "Failed to fetch withdrawal effects" });
    }
  });

  // ========== Drug Lab Routes ==========
  app.get("/api/user/drug-labs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const labs = await drugStorage.getUserLabs(userId);
      res.json(labs);
    } catch (error) {
      console.error("Error fetching drug labs:", error);
      res.status(500).json({ error: "Failed to fetch drug labs" });
    }
  });

  app.get("/api/user/drug-labs/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const labId = parseInt(req.params.id);
      const lab = await drugStorage.getDrugLab(labId);
      
      if (!lab) {
        return res.status(404).json({ error: "Lab not found" });
      }
      
      // Ensure the lab belongs to the user
      if (lab.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to view this lab" });
      }
      
      res.json(lab);
    } catch (error) {
      console.error("Error fetching drug lab:", error);
      res.status(500).json({ error: "Failed to fetch drug lab" });
    }
  });

  app.post("/api/user/drug-labs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const labData = insertDrugLabSchema.parse({
        ...req.body,
        userId,
      });
      
      // Check if user has enough cash
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.cash < labData.costToUpgrade) {
        return res.status(400).json({ error: "Not enough cash to create a lab" });
      }
      
      // Deduct cash from user
      await storage.updateUser(userId, { cash: user.cash - labData.costToUpgrade });
      
      // Create the lab
      const newLab = await drugStorage.createDrugLab(labData);
      
      res.status(201).json({
        lab: newLab,
        message: `Successfully created drug lab "${newLab.name}"`,
        cashSpent: labData.costToUpgrade,
        remainingCash: user.cash - labData.costToUpgrade,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodError(error, res);
      } else {
        console.error("Error creating drug lab:", error);
        res.status(500).json({ error: "Failed to create drug lab" });
      }
    }
  });

  app.patch("/api/user/drug-labs/:id/upgrade", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const labId = parseInt(req.params.id);
      
      // Get the lab
      const lab = await drugStorage.getDrugLab(labId);
      if (!lab) {
        return res.status(404).json({ error: "Lab not found" });
      }
      
      // Ensure the lab belongs to the user
      if (lab.userId !== userId) {
        return res.status(403).json({ error: "You don't have permission to upgrade this lab" });
      }
      
      // Check if user has enough cash
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.cash < lab.costToUpgrade) {
        return res.status(400).json({ error: "Not enough cash to upgrade lab" });
      }
      
      // Deduct cash from user
      await storage.updateUser(userId, { cash: user.cash - lab.costToUpgrade });
      
      // Upgrade the lab
      const upgradedLab = await drugStorage.upgradeDrugLab(labId);
      
      res.json({
        lab: upgradedLab,
        message: `Successfully upgraded lab to level ${upgradedLab!.level}`,
        cashSpent: lab.costToUpgrade,
        remainingCash: user.cash - lab.costToUpgrade,
      });
    } catch (error) {
      console.error("Error upgrading drug lab:", error);
      res.status(500).json({ error: "Failed to upgrade drug lab" });
    }
  });

  // ========== Drug Production Routes ==========
  app.get("/api/user/drug-labs/:id/production", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const labId = parseInt(req.params.id);
      const lab = await drugStorage.getDrugLab(labId);
      
      if (!lab) {
        return res.status(404).json({ error: "Lab not found" });
      }
      
      // Ensure the lab belongs to the user
      if (lab.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to view this lab's production" });
      }
      
      const production = await drugStorage.getLabProductions(labId);
      res.json(production);
    } catch (error) {
      console.error("Error fetching production:", error);
      res.status(500).json({ error: "Failed to fetch production" });
    }
  });

  app.post("/api/user/drug-labs/:id/production", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const labId = parseInt(req.params.id);
      
      // Get the lab
      const lab = await drugStorage.getDrugLab(labId);
      if (!lab) {
        return res.status(404).json({ error: "Lab not found" });
      }
      
      // Ensure the lab belongs to the user
      if (lab.userId !== userId) {
        return res.status(403).json({ error: "You don't have permission to use this lab" });
      }
      
      // Validate production data
      const productionData = insertDrugProductionSchema.parse({
        ...req.body,
        labId,
      });
      
      // Get drug details
      const drug = await drugStorage.getDrug(productionData.drugId);
      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }
      
      // Check if user has required ingredients
      const drugWithRecipe = await drugStorage.getDrugWithRecipe(productionData.drugId);
      if (!drugWithRecipe || drugWithRecipe.recipes.length === 0) {
        return res.status(400).json({ error: "This drug doesn't have a recipe" });
      }
      
      // Check for each ingredient
      for (const recipe of drugWithRecipe.recipes) {
        const userIngredient = await drugStorage.getUserIngredient(userId, recipe.ingredientId);
        const requiredQuantity = recipe.quantity * productionData.quantity;
        
        if (!userIngredient || userIngredient.quantity < requiredQuantity) {
          return res.status(400).json({
            error: `Not enough ${recipe.ingredient.name}. Need ${requiredQuantity}, have ${userIngredient?.quantity || 0}`,
          });
        }
      }
      
      // Consume ingredients
      for (const recipe of drugWithRecipe.recipes) {
        const requiredQuantity = recipe.quantity * productionData.quantity;
        await drugStorage.removeIngredientFromUser(userId, recipe.ingredientId, requiredQuantity);
      }
      
      // Calculate production time based on drug complexity and lab level
      const baseTimeHours = 2; // Base production time in hours
      const timeReductionPerLevel = 0.1; // 10% reduction per lab level
      const timeMultiplier = Math.max(0.5, 1 - (lab.level * timeReductionPerLevel)); // At least 50% of base time
      
      const productionTimeHours = baseTimeHours * timeMultiplier * productionData.quantity;
      const completesAt = new Date();
      completesAt.setHours(completesAt.getHours() + productionTimeHours);
      
      // Calculate success rate based on lab security and drug risk
      const baseSuccessRate = 90; // Base 90% success rate
      const successRateDeduction = drug.riskLevel * 2; // 2% deduction per risk level
      const securityBonus = lab.securityLevel * 3; // 3% bonus per security level
      
      const successRate = Math.min(99, Math.max(50, baseSuccessRate - successRateDeduction + securityBonus));
      
      // Start production
      const production = await drugStorage.startDrugProduction({
        ...productionData,
        completesAt,
        successRate,
      });
      
      res.status(201).json({
        production,
        message: `Started production of ${productionData.quantity}x ${drug.name}`,
        completesAt,
        estimated_time_hours: productionTimeHours.toFixed(1),
        success_rate: `${successRate}%`,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodError(error, res);
      } else {
        console.error("Error starting production:", error);
        res.status(500).json({ error: "Failed to start production" });
      }
    }
  });

  app.post("/api/user/drug-labs/collect-production", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Get all completed productions for user's labs
      const userLabs = await drugStorage.getUserLabs(userId);
      const labIds = userLabs.map(lab => lab.id);
      
      if (labIds.length === 0) {
        return res.status(404).json({ error: "You don't have any labs" });
      }
      
      // Find all completed productions
      const completedProductions = await drugStorage.getCompletedProductions();
      const userProductions = completedProductions.filter(production => 
        production.lab.userId === userId
      );
      
      if (userProductions.length === 0) {
        return res.status(404).json({ error: "No completed productions found" });
      }
      
      // Process each production
      const results = [];
      let totalSuccessful = 0;
      let totalFailed = 0;
      
      for (const production of userProductions) {
        // Mark as completed
        await drugStorage.completeProduction(production.id);
        
        // Calculate success based on success rate
        const success = Math.random() * 100 <= production.successRate;
        
        if (success) {
          // Add drugs to user's inventory
          await drugStorage.addDrugToUser({
            userId,
            drugId: production.drugId,
            quantity: production.quantity,
          });
          
          totalSuccessful += production.quantity;
          results.push({
            drugName: production.drug.name,
            quantity: production.quantity,
            success: true,
          });
        } else {
          totalFailed += production.quantity;
          results.push({
            drugName: production.drug.name,
            quantity: production.quantity,
            success: false,
          });
        }
      }
      
      res.json({
        message: `Collected production: ${totalSuccessful} successful, ${totalFailed} failed`,
        results,
      });
    } catch (error) {
      console.error("Error collecting production:", error);
      res.status(500).json({ error: "Failed to collect production" });
    }
  });

  // ========== Drug Territory Routes ==========
  app.get("/api/drug-territories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const territories = await drugStorage.getAllTerritories();
      res.json(territories);
    } catch (error) {
      console.error("Error fetching territories:", error);
      res.status(500).json({ error: "Failed to fetch territories" });
    }
  });

  // ========== Drug Dealing Routes ==========
  app.get("/api/drug-deals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const deals = await drugStorage.getUserDrugDeals(userId);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching drug deals:", error);
      res.status(500).json({ error: "Failed to fetch drug deals" });
    }
  });

  app.get("/api/drug-market", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const publicDeals = await drugStorage.getPublicDrugDeals();
      res.json(publicDeals);
    } catch (error) {
      console.error("Error fetching drug market:", error);
      res.status(500).json({ error: "Failed to fetch drug market" });
    }
  });

  app.post("/api/drug-deals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const dealData = insertDrugDealSchema.parse({
        ...req.body,
        sellerId: userId,
      });
      
      // Check if user has enough of the drug
      const userDrug = await drugStorage.getUserDrug(userId, dealData.drugId);
      if (!userDrug || userDrug.quantity < dealData.quantity) {
        return res.status(400).json({ error: "You don't have enough of this drug" });
      }
      
      // Remove drugs from user's inventory
      await drugStorage.removeDrugFromUser(userId, dealData.drugId, dealData.quantity);
      
      // Create the deal
      const newDeal = await drugStorage.createDrugDeal(dealData);
      
      res.status(201).json({
        deal: newDeal,
        message: `Listed ${dealData.quantity}x drug for sale`,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodError(error, res);
      } else {
        console.error("Error creating drug deal:", error);
        res.status(500).json({ error: "Failed to create drug deal" });
      }
    }
  });

  app.post("/api/drug-deals/:id/buy", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const dealId = parseInt(req.params.id);
      
      // Get the deal
      const deal = await drugStorage.getDrugDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      // Check if deal is available
      if (deal.status !== "pending") {
        return res.status(400).json({ error: "This deal is no longer available" });
      }
      
      // Ensure user is not buying their own deal
      if (deal.sellerId === userId) {
        return res.status(400).json({ error: "You cannot buy your own deal" });
      }
      
      // Check if user has enough cash
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.cash < deal.totalPrice) {
        return res.status(400).json({ error: "Not enough cash to buy this deal" });
      }
      
      // Get seller
      const seller = await storage.getUser(deal.sellerId);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      
      // Calculate risk of police intervention
      let policeIntervention = false;
      const baseRisk = deal.riskLevel || 1;
      const territoryRiskModifier = 1.0; // Default risk modifier
      
      // Calculate combined risk
      const combinedRisk = baseRisk * territoryRiskModifier;
      const randomRisk = Math.random() * 100;
      
      if (randomRisk < combinedRisk) {
        policeIntervention = true;
      }
      
      if (policeIntervention) {
        // Deal is busted by police
        await drugStorage.updateDrugDealStatus(dealId, "failed");
        
        // Random jail time based on deal value
        const jailTimeHours = Math.min(24, Math.max(1, Math.floor(deal.totalPrice / 1000)));
        const jailTimeEnd = new Date();
        jailTimeEnd.setHours(jailTimeEnd.getHours() + jailTimeHours);
        
        // Put user in jail
        await storage.updateUser(userId, {
          isJailed: true,
          jailTimeEnd,
        });
        
        return res.status(200).json({
          success: false,
          message: "Police interrupted the deal! You've been arrested.",
          jailTime: `${jailTimeHours} hours`,
          jailTimeEnd,
        });
      }
      
      // Update deal status
      await drugStorage.updateDrugDealStatus(dealId, "completed", userId);
      
      // Transfer funds from buyer to seller
      await storage.updateUser(userId, { cash: user.cash - deal.totalPrice });
      await storage.updateUser(deal.sellerId, { cash: seller.cash + deal.totalPrice });
      
      // Add drugs to buyer's inventory
      await drugStorage.addDrugToUser({
        userId,
        drugId: deal.drugId,
        quantity: deal.quantity,
      });
      
      res.json({
        success: true,
        message: `Successfully purchased ${deal.quantity}x drugs for ${deal.totalPrice}`,
        remainingCash: user.cash - deal.totalPrice,
      });
    } catch (error) {
      console.error("Error buying drug deal:", error);
      res.status(500).json({ error: "Failed to buy drug deal" });
    }
  });

  app.post("/api/drug-deals/:id/cancel", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const dealId = parseInt(req.params.id);
      
      // Get the deal
      const deal = await drugStorage.getDrugDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      // Ensure the deal belongs to the user
      if (deal.sellerId !== userId) {
        return res.status(403).json({ error: "You don't have permission to cancel this deal" });
      }
      
      // Check if deal can be cancelled
      if (deal.status !== "pending") {
        return res.status(400).json({ error: "This deal cannot be cancelled" });
      }
      
      // Update deal status
      await drugStorage.updateDrugDealStatus(dealId, "cancelled");
      
      // Return drugs to seller's inventory
      await drugStorage.addDrugToUser({
        userId,
        drugId: deal.drugId,
        quantity: deal.quantity,
      });
      
      res.json({
        message: `Deal cancelled, ${deal.quantity}x drugs returned to your inventory`,
      });
    } catch (error) {
      console.error("Error cancelling drug deal:", error);
      res.status(500).json({ error: "Failed to cancel drug deal" });
    }
  });

  // For periodic tasks like processing drug effects, handling withdrawals etc.
  app.post("/api/system/process-drug-effects", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // This endpoint would be called by a cron job or similar to process drug effects
      // It would update user stats based on active drugs, process withdrawal effects, etc.
      
      // For now, just return a success message
      res.json({
        message: "Drug effects processed",
      });
    } catch (error) {
      console.error("Error processing drug effects:", error);
      res.status(500).json({ error: "Failed to process drug effects" });
    }
  });

  // Seeding route (for development)
  app.post("/api/dev/seed-drugs", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      await drugStorage.initializeDefaultDrugs();
      res.json({ message: "Drug data seeded successfully" });
    } catch (error) {
      console.error("Error seeding drug data:", error);
      res.status(500).json({ error: "Failed to seed drug data" });
    }
  });
}