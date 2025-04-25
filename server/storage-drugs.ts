import { eq, and, sql, desc, asc, or, gt, lt, between, inArray, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  drugs,
  drugIngredients,
  drugRecipes,
  userDrugs,
  userIngredients,
  drugLabs,
  drugProduction,
  drugDeals,
  drugAddictions,
  drugTerritories,
  type Drug,
  type InsertDrug,
  type DrugIngredient,
  type InsertDrugIngredient,
  type DrugRecipe,
  type InsertDrugRecipe,
  type UserDrug,
  type InsertUserDrug,
  type UserIngredient,
  type InsertUserIngredient,
  type DrugLab,
  type InsertDrugLab,
  type DrugProduction,
  type InsertDrugProduction,
  type DrugDeal,
  type InsertDrugDeal,
  type DrugAddiction,
  type InsertDrugAddiction,
  type DrugTerritory,
  type InsertDrugTerritory,
  type DrugWithQuantity,
  type DrugWithRecipe,
} from "@shared/schema";

export class DrugStorage {
  // Drug CRUD operations
  async getAllDrugs(): Promise<Drug[]> {
    return await db.select().from(drugs).orderBy(drugs.name);
  }

  async getDrug(id: number): Promise<Drug | undefined> {
    const [drug] = await db.select().from(drugs).where(eq(drugs.id, id));
    return drug;
  }

  async createDrug(insertDrug: InsertDrug): Promise<Drug> {
    const [drug] = await db.insert(drugs).values(insertDrug).returning();
    return drug;
  }

  async updateDrug(id: number, drugData: Partial<Drug>): Promise<Drug | undefined> {
    const [updatedDrug] = await db
      .update(drugs)
      .set(drugData)
      .where(eq(drugs.id, id))
      .returning();
    
    return updatedDrug;
  }

  async deleteDrug(id: number): Promise<boolean> {
    try {
      await db.delete(drugs).where(eq(drugs.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting drug:", error);
      return false;
    }
  }

  // Drug Ingredient CRUD operations
  async getAllDrugIngredients(): Promise<DrugIngredient[]> {
    return await db.select().from(drugIngredients).orderBy(drugIngredients.name);
  }

  async getDrugIngredient(id: number): Promise<DrugIngredient | undefined> {
    const [ingredient] = await db.select().from(drugIngredients).where(eq(drugIngredients.id, id));
    return ingredient;
  }

  async createDrugIngredient(insertIngredient: InsertDrugIngredient): Promise<DrugIngredient> {
    const [ingredient] = await db.insert(drugIngredients).values(insertIngredient).returning();
    return ingredient;
  }

  // Drug Recipe CRUD operations
  async getDrugRecipes(drugId: number): Promise<(DrugRecipe & { ingredient: DrugIngredient })[]> {
    return await db
      .select({
        id: drugRecipes.id,
        drugId: drugRecipes.drugId,
        ingredientId: drugRecipes.ingredientId,
        quantity: drugRecipes.quantity,
        ingredient: drugIngredients,
      })
      .from(drugRecipes)
      .leftJoin(drugIngredients, eq(drugRecipes.ingredientId, drugIngredients.id))
      .where(eq(drugRecipes.drugId, drugId));
  }

  async createDrugRecipe(insertRecipe: InsertDrugRecipe): Promise<DrugRecipe> {
    const [recipe] = await db.insert(drugRecipes).values(insertRecipe).returning();
    return recipe;
  }

  async getDrugWithRecipe(drugId: number): Promise<DrugWithRecipe | undefined> {
    const drug = await this.getDrug(drugId);
    if (!drug) return undefined;

    const recipes = await this.getDrugRecipes(drugId);
    
    return {
      ...drug,
      recipes,
    };
  }
  
  // User Drug Inventory operations
  async getUserDrugs(userId: number): Promise<DrugWithQuantity[]> {
    return await db
      .select({
        id: drugs.id,
        name: drugs.name,
        description: drugs.description,
        basePrice: drugs.basePrice,
        riskLevel: drugs.riskLevel,
        addictionRate: drugs.addictionRate,
        strengthBonus: drugs.strengthBonus,
        stealthBonus: drugs.stealthBonus,
        charismaBonus: drugs.charismaBonus,
        intelligenceBonus: drugs.intelligenceBonus,
        cashGainBonus: drugs.cashGainBonus,
        durationHours: drugs.durationHours,
        sideEffects: drugs.sideEffects,
        image: drugs.image,
        createdAt: drugs.createdAt,
        quantity: userDrugs.quantity,
      })
      .from(userDrugs)
      .innerJoin(drugs, eq(userDrugs.drugId, drugs.id))
      .where(eq(userDrugs.userId, userId));
  }

  async getUserDrug(userId: number, drugId: number): Promise<UserDrug | undefined> {
    const [userDrug] = await db
      .select()
      .from(userDrugs)
      .where(and(eq(userDrugs.userId, userId), eq(userDrugs.drugId, drugId)));
    
    return userDrug;
  }

  async addDrugToUser(insertUserDrug: InsertUserDrug): Promise<UserDrug> {
    // Check if the user already has this drug
    const existingDrug = await this.getUserDrug(insertUserDrug.userId, insertUserDrug.drugId);
    
    if (existingDrug) {
      // Update quantity if the user already has this drug
      const updatedQuantity = existingDrug.quantity + (insertUserDrug.quantity || 1);
      const [updatedDrug] = await db
        .update(userDrugs)
        .set({ quantity: updatedQuantity })
        .where(eq(userDrugs.id, existingDrug.id))
        .returning();
      
      return updatedDrug;
    } else {
      // Add new drug to user's inventory
      const [newDrug] = await db.insert(userDrugs).values(insertUserDrug).returning();
      return newDrug;
    }
  }

  async removeDrugFromUser(userId: number, drugId: number, quantity: number = 1): Promise<boolean> {
    const userDrug = await this.getUserDrug(userId, drugId);
    
    if (!userDrug) return false;
    
    if (userDrug.quantity <= quantity) {
      // Remove the drug completely if quantity is less than or equal to requested removal amount
      await db
        .delete(userDrugs)
        .where(eq(userDrugs.id, userDrug.id));
    } else {
      // Decrease the quantity
      await db
        .update(userDrugs)
        .set({ quantity: userDrug.quantity - quantity })
        .where(eq(userDrugs.id, userDrug.id));
    }
    
    return true;
  }

  // User Ingredient Inventory operations
  async getUserIngredients(userId: number): Promise<(UserIngredient & { ingredient: DrugIngredient })[]> {
    return await db
      .select({
        id: userIngredients.id,
        userId: userIngredients.userId,
        ingredientId: userIngredients.ingredientId,
        quantity: userIngredients.quantity,
        acquiredAt: userIngredients.acquiredAt,
        ingredient: drugIngredients,
      })
      .from(userIngredients)
      .innerJoin(drugIngredients, eq(userIngredients.ingredientId, drugIngredients.id))
      .where(eq(userIngredients.userId, userId));
  }

  async getUserIngredient(userId: number, ingredientId: number): Promise<UserIngredient | undefined> {
    const [userIngredient] = await db
      .select()
      .from(userIngredients)
      .where(and(eq(userIngredients.userId, userId), eq(userIngredients.ingredientId, ingredientId)));
    
    return userIngredient;
  }

  async addIngredientToUser(insertUserIngredient: InsertUserIngredient): Promise<UserIngredient> {
    const existingIngredient = await this.getUserIngredient(
      insertUserIngredient.userId, 
      insertUserIngredient.ingredientId
    );
    
    if (existingIngredient) {
      const updatedQuantity = existingIngredient.quantity + (insertUserIngredient.quantity || 1);
      const [updatedIngredient] = await db
        .update(userIngredients)
        .set({ quantity: updatedQuantity })
        .where(eq(userIngredients.id, existingIngredient.id))
        .returning();
      
      return updatedIngredient;
    } else {
      const [newIngredient] = await db.insert(userIngredients).values(insertUserIngredient).returning();
      return newIngredient;
    }
  }

  async removeIngredientFromUser(userId: number, ingredientId: number, quantity: number = 1): Promise<boolean> {
    const userIngredient = await this.getUserIngredient(userId, ingredientId);
    
    if (!userIngredient) return false;
    
    if (userIngredient.quantity <= quantity) {
      await db
        .delete(userIngredients)
        .where(eq(userIngredients.id, userIngredient.id));
    } else {
      await db
        .update(userIngredients)
        .set({ quantity: userIngredient.quantity - quantity })
        .where(eq(userIngredients.id, userIngredient.id));
    }
    
    return true;
  }

  // Drug Lab operations
  async getUserLabs(userId: number): Promise<DrugLab[]> {
    try {
      // Explicitly select only the columns we know exist in the database
      // This avoids the 'last_raided_at' column error
      const labs = await db
        .select({
          id: drugLabs.id,
          userId: drugLabs.userId,
          name: drugLabs.name,
          level: drugLabs.level,
          securityLevel: drugLabs.securityLevel,
          capacity: drugLabs.capacity,
          costToUpgrade: drugLabs.costToUpgrade,
          location: drugLabs.location,
          discoveryChance: drugLabs.discoveryChance,
          createdAt: drugLabs.createdAt
        })
        .from(drugLabs)
        .where(eq(drugLabs.userId, userId))
        .orderBy(drugLabs.level, desc);
      
      // Ensure location has a default value if it's null
      return labs.map(lab => ({
        ...lab,
        location: lab.location || 'Hidden Location',
        // Add a default value for lastRaidedAt since the schema expects it
        lastRaidedAt: null
      }));
    } catch (error) {
      console.error("Error fetching drug labs:", error);
      throw error;
    }
  }

  async getDrugLab(id: number): Promise<DrugLab | undefined> {
    const [lab] = await db
      .select({
        id: drugLabs.id,
        userId: drugLabs.userId,
        name: drugLabs.name,
        level: drugLabs.level,
        securityLevel: drugLabs.securityLevel, 
        capacity: drugLabs.capacity,
        costToUpgrade: drugLabs.costToUpgrade,
        location: drugLabs.location,
        discoveryChance: drugLabs.discoveryChance,
        createdAt: drugLabs.createdAt
      })
      .from(drugLabs)
      .where(eq(drugLabs.id, id));
    
    if (!lab) return undefined;
    
    return {
      ...lab,
      location: lab.location || 'Hidden Location',
      lastRaidedAt: null
    };
  }

  async createDrugLab(insertLab: InsertDrugLab): Promise<DrugLab> {
    const [lab] = await db.insert(drugLabs).values(insertLab).returning();
    return lab;
  }

  async updateDrugLab(id: number, labData: Partial<DrugLab>): Promise<DrugLab | undefined> {
    const [updatedLab] = await db
      .update(drugLabs)
      .set(labData)
      .where(eq(drugLabs.id, id))
      .returning();
    
    return updatedLab;
  }

  async upgradeDrugLab(id: number): Promise<DrugLab | undefined> {
    const lab = await this.getDrugLab(id);
    if (!lab) return undefined;

    const newLevel = lab.level + 1;
    const newSecurityLevel = lab.securityLevel + 1;
    const newCapacity = lab.capacity + 5;
    const newCostToUpgrade = lab.costToUpgrade * 1.5;
    const newDiscoveryChance = Math.max(1, lab.discoveryChance - 1); // Reduce discovery chance with each upgrade

    return await this.updateDrugLab(id, {
      level: newLevel,
      securityLevel: newSecurityLevel,
      capacity: newCapacity,
      costToUpgrade: Math.floor(newCostToUpgrade),
      discoveryChance: newDiscoveryChance,
    });
  }

  // Drug Production operations
  async getLabProductions(labId: number): Promise<(DrugProduction & { drug: Drug })[]> {
    return await db
      .select({
        id: drugProduction.id,
        labId: drugProduction.labId,
        drugId: drugProduction.drugId,
        quantity: drugProduction.quantity,
        startedAt: drugProduction.startedAt,
        completesAt: drugProduction.completesAt,
        isCompleted: drugProduction.isCompleted,
        successRate: drugProduction.successRate,
        drug: drugs,
      })
      .from(drugProduction)
      .innerJoin(drugs, eq(drugProduction.drugId, drugs.id))
      .where(eq(drugProduction.labId, labId));
  }

  async getCompletedProductions(): Promise<(DrugProduction & { drug: Drug, lab: DrugLab })[]> {
    const productions = await db
      .select({
        id: drugProduction.id,
        labId: drugProduction.labId,
        drugId: drugProduction.drugId,
        quantity: drugProduction.quantity,
        startedAt: drugProduction.startedAt,
        completesAt: drugProduction.completesAt,
        isCompleted: drugProduction.isCompleted,
        successRate: drugProduction.successRate,
        drug: drugs,
        lab: {
          id: drugLabs.id,
          userId: drugLabs.userId,
          name: drugLabs.name,
          level: drugLabs.level,
          securityLevel: drugLabs.securityLevel,
          capacity: drugLabs.capacity,
          costToUpgrade: drugLabs.costToUpgrade,
          location: drugLabs.location,
          discoveryChance: drugLabs.discoveryChance,
          createdAt: drugLabs.createdAt
        }
      })
      .from(drugProduction)
      .innerJoin(drugs, eq(drugProduction.drugId, drugs.id))
      .innerJoin(drugLabs, eq(drugProduction.labId, drugLabs.id))
      .where(
        and(
          eq(drugProduction.isCompleted, false),
          lt(drugProduction.completesAt, new Date())
        )
      );
      
    // Add the missing lastRaidedAt property to each lab
    return productions.map(prod => ({
      ...prod,
      lab: {
        ...prod.lab,
        location: prod.lab.location || 'Hidden Location',
        lastRaidedAt: null
      }
    }));
  }

  async startDrugProduction(insertProduction: InsertDrugProduction): Promise<DrugProduction> {
    const [production] = await db.insert(drugProduction).values(insertProduction).returning();
    return production;
  }

  async completeProduction(id: number): Promise<DrugProduction | undefined> {
    const [updatedProduction] = await db
      .update(drugProduction)
      .set({ isCompleted: true })
      .where(eq(drugProduction.id, id))
      .returning();
    
    return updatedProduction;
  }

  // Drug Deals operations
  async getUserDrugDeals(userId: number): Promise<(DrugDeal & { drug: Drug })[]> {
    return await db
      .select({
        id: drugDeals.id,
        sellerId: drugDeals.sellerId,
        buyerId: drugDeals.buyerId,
        drugId: drugDeals.drugId,
        quantity: drugDeals.quantity,
        pricePerUnit: drugDeals.pricePerUnit,
        totalPrice: drugDeals.totalPrice,
        status: drugDeals.status,
        isPublic: drugDeals.isPublic,
        riskLevel: drugDeals.riskLevel,
        createdAt: drugDeals.createdAt,
        completedAt: drugDeals.completedAt,
        drug: drugs,
      })
      .from(drugDeals)
      .innerJoin(drugs, eq(drugDeals.drugId, drugs.id))
      .where(or(eq(drugDeals.sellerId, userId), eq(drugDeals.buyerId, userId)))
      .orderBy(drugDeals.createdAt, desc);
  }

  async getPublicDrugDeals(): Promise<(DrugDeal & { drug: Drug, seller: { username: string } })[]> {
    return await db
      .select({
        id: drugDeals.id,
        sellerId: drugDeals.sellerId,
        buyerId: drugDeals.buyerId,
        drugId: drugDeals.drugId,
        quantity: drugDeals.quantity,
        pricePerUnit: drugDeals.pricePerUnit,
        totalPrice: drugDeals.totalPrice,
        status: drugDeals.status,
        isPublic: drugDeals.isPublic,
        riskLevel: drugDeals.riskLevel,
        createdAt: drugDeals.createdAt,
        completedAt: drugDeals.completedAt,
        drug: drugs,
        seller: {
          username: users.username,
        },
      })
      .from(drugDeals)
      .innerJoin(drugs, eq(drugDeals.drugId, drugs.id))
      .innerJoin(users, eq(drugDeals.sellerId, users.id))
      .where(and(eq(drugDeals.isPublic, true), eq(drugDeals.status, "pending")))
      .orderBy(drugDeals.createdAt, desc);
  }

  async getDrugDeal(id: number): Promise<DrugDeal | undefined> {
    const [deal] = await db.select().from(drugDeals).where(eq(drugDeals.id, id));
    return deal;
  }

  async createDrugDeal(insertDeal: InsertDrugDeal): Promise<DrugDeal> {
    const [deal] = await db.insert(drugDeals).values(insertDeal).returning();
    return deal;
  }

  async updateDrugDealStatus(id: number, status: string, buyerId?: number): Promise<DrugDeal | undefined> {
    const updateData: { status: string; buyerId?: number; completedAt?: Date } = { 
      status,
    };
    
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    
    if (buyerId !== undefined) {
      updateData.buyerId = buyerId;
    }
    
    const [updatedDeal] = await db
      .update(drugDeals)
      .set(updateData)
      .where(eq(drugDeals.id, id))
      .returning();
    
    return updatedDeal;
  }

  // Drug Addiction operations
  async getUserAddictions(userId: number): Promise<(DrugAddiction & { drug: Drug })[]> {
    return await db
      .select({
        id: drugAddictions.id,
        userId: drugAddictions.userId,
        drugId: drugAddictions.drugId,
        level: drugAddictions.level,
        withdrawalEffect: drugAddictions.withdrawalEffect,
        lastDosage: drugAddictions.lastDosage,
        createdAt: drugAddictions.createdAt,
        drug: drugs,
      })
      .from(drugAddictions)
      .innerJoin(drugs, eq(drugAddictions.drugId, drugs.id))
      .where(eq(drugAddictions.userId, userId));
  }

  async getUserAddiction(userId: number, drugId: number): Promise<DrugAddiction | undefined> {
    const [addiction] = await db
      .select()
      .from(drugAddictions)
      .where(and(eq(drugAddictions.userId, userId), eq(drugAddictions.drugId, drugId)));
    
    return addiction;
  }

  async createOrUpdateAddiction(userId: number, drugId: number, withdrawalEffect: string): Promise<DrugAddiction> {
    const existingAddiction = await this.getUserAddiction(userId, drugId);
    
    if (existingAddiction) {
      // Increase addiction level with each use, max level is 10
      const newLevel = Math.min(10, existingAddiction.level + 1);
      const [updatedAddiction] = await db
        .update(drugAddictions)
        .set({ 
          level: newLevel,
          lastDosage: new Date(),
        })
        .where(eq(drugAddictions.id, existingAddiction.id))
        .returning();
      
      return updatedAddiction;
    } else {
      const [newAddiction] = await db
        .insert(drugAddictions)
        .values({
          userId,
          drugId,
          level: 1,
          withdrawalEffect,
          lastDosage: new Date(),
        })
        .returning();
      
      return newAddiction;
    }
  }

  async getWithdrawalEffects(userId: number): Promise<{ drugId: number, drugName: string, effect: string, severity: number }[]> {
    const now = new Date();
    const withdrawalHours = 24; // Withdrawal starts after 24 hours since last dosage
    
    // Get all addictions where last dosage was more than 24 hours ago
    const addictions = await db
      .select({
        id: drugAddictions.id,
        drugId: drugAddictions.drugId,
        drugName: drugs.name,
        level: drugAddictions.level,
        effect: drugAddictions.withdrawalEffect,
        lastDosage: drugAddictions.lastDosage,
      })
      .from(drugAddictions)
      .innerJoin(drugs, eq(drugAddictions.drugId, drugs.id))
      .where(
        and(
          eq(drugAddictions.userId, userId),
          lt(drugAddictions.lastDosage, new Date(now.getTime() - withdrawalHours * 60 * 60 * 1000))
        )
      );
    
    // Calculate severity based on addiction level and time since last dosage
    return addictions.map(addiction => {
      const hoursSinceLastDosage = (now.getTime() - addiction.lastDosage.getTime()) / (60 * 60 * 1000);
      // Severity increases with addiction level and time since last dosage (caps at 10)
      const severity = Math.min(10, addiction.level + Math.floor((hoursSinceLastDosage - withdrawalHours) / 12));
      
      return {
        drugId: addiction.drugId,
        drugName: addiction.drugName,
        effect: addiction.effect,
        severity,
      };
    });
  }

  // Drug Territory operations
  async getAllTerritories(): Promise<DrugTerritory[]> {
    try {
      const territories = await db.select().from(drugTerritories);
      
      // Ensure image has a default value if it's null
      return territories.map(territory => ({
        ...territory,
        image: territory.image || '/territories/default-territory.png'
      }));
    } catch (error) {
      console.error("Error fetching territories:", error);
      throw error;
    }
  }

  async getTerritory(id: number): Promise<DrugTerritory | undefined> {
    const [territory] = await db.select().from(drugTerritories).where(eq(drugTerritories.id, id));
    return territory;
  }

  async createTerritory(insertTerritory: InsertDrugTerritory): Promise<DrugTerritory> {
    const [territory] = await db.insert(drugTerritories).values(insertTerritory).returning();
    return territory;
  }

  async updateTerritoryControl(territoryId: number, gangId: number | null): Promise<DrugTerritory | undefined> {
    const [updatedTerritory] = await db
      .update(drugTerritories)
      .set({ controlledBy: gangId })
      .where(eq(drugTerritories.id, territoryId))
      .returning();
    
    return updatedTerritory;
  }

  // System operations
  async initializeDefaultDrugs(): Promise<void> {
    const existingDrugs = await this.getAllDrugs();
    if (existingDrugs.length > 0) return;

    // List of default drugs
    const defaultDrugs: InsertDrug[] = [
      {
        name: "Stardust",
        description: "A sparkling powder that enhances charisma and social abilities.",
        basePrice: 500,
        riskLevel: 3,
        addictionRate: 15,
        charismaBonus: 20,
        durationHours: 4,
        sideEffects: "Insomnia, temporary euphoria followed by mild depression",
        image: "/drugs/stardust.png",
      },
      {
        name: "Shade",
        description: "A dark liquid that enhances stealth abilities and perception.",
        basePrice: 750,
        riskLevel: 4,
        addictionRate: 20,
        stealthBonus: 25,
        durationHours: 3,
        sideEffects: "Paranoia, sensitivity to light, auditory hallucinations",
        image: "/drugs/shade.png",
      },
      {
        name: "Titan",
        description: "A powerful stimulant that significantly boosts strength.",
        basePrice: 1000,
        riskLevel: 6,
        addictionRate: 30,
        strengthBonus: 35,
        durationHours: 5,
        sideEffects: "Aggression, heart palpitations, severe crashes",
        image: "/drugs/titan.png",
      },
      {
        name: "Brainwave",
        description: "A cognitive enhancer that boosts intelligence and problem-solving abilities.",
        basePrice: 1200,
        riskLevel: 5,
        addictionRate: 25,
        intelligenceBonus: 30,
        durationHours: 6,
        sideEffects: "Headaches, difficulty sleeping, diminished emotional response",
        image: "/drugs/brainwave.png",
      },
      {
        name: "Fortunate",
        description: "A rare substance that increases luck and money earned from crimes.",
        basePrice: 2000,
        riskLevel: 7,
        addictionRate: 40,
        cashGainBonus: 15,
        durationHours: 4,
        sideEffects: "Impulsivity, risk-taking behavior, hallucinations",
        image: "/drugs/fortunate.png",
      },
      {
        name: "Blend",
        description: "A balanced mixture that provides moderate boosts to all attributes.",
        basePrice: 3000,
        riskLevel: 8,
        addictionRate: 50,
        strengthBonus: 10,
        stealthBonus: 10,
        charismaBonus: 10,
        intelligenceBonus: 10,
        durationHours: 3,
        sideEffects: "Disorientation, mood swings, severe addiction potential",
        image: "/drugs/blend.png",
      },
      {
        name: "Phantom",
        description: "An exotic compound that makes users nearly invisible to detection.",
        basePrice: 5000,
        riskLevel: 9,
        addictionRate: 60,
        stealthBonus: 50,
        durationHours: 2,
        sideEffects: "Temporary dissociation, feeling of unreality, withdrawal causes extreme anxiety",
        image: "/drugs/phantom.png",
      },
      {
        name: "Kingmaker",
        description: "The most prestigious and dangerous drug, rumored to be used only by crime lords.",
        basePrice: 10000,
        riskLevel: 10,
        addictionRate: 75,
        strengthBonus: 20,
        stealthBonus: 20,
        charismaBonus: 40,
        intelligenceBonus: 30,
        cashGainBonus: 25,
        durationHours: 8,
        sideEffects: "Severe paranoia, god complex, potentially fatal withdrawal",
        image: "/drugs/kingmaker.png",
      },
    ];

    // Create each drug
    for (const drug of defaultDrugs) {
      await this.createDrug(drug);
    }

    // Add ingredients
    const defaultIngredients: InsertDrugIngredient[] = [
      {
        name: "Basic Chemical",
        description: "A common chemical found in many household products",
        price: 100,
        rarity: 1,
      },
      {
        name: "Synthetic Compound",
        description: "A manufactured compound used in pharmaceutical applications",
        price: 250,
        rarity: 3,
      },
      {
        name: "Rare Extract",
        description: "An exotic plant extract with unique properties",
        price: 500,
        rarity: 5,
      },
      {
        name: "Crystalline Powder",
        description: "A refined powder that serves as a base for many drugs",
        price: 750,
        rarity: 6,
      },
      {
        name: "Exotic Mineral",
        description: "A rare mineral with unusual chemical properties",
        price: 1000,
        rarity: 7,
      },
      {
        name: "Forbidden Substance",
        description: "A tightly controlled substance with powerful effects",
        price: 2000,
        rarity: 9,
      },
    ];

    for (const ingredient of defaultIngredients) {
      await this.createDrugIngredient(ingredient);
    }

    // Add territories
    const defaultTerritories: InsertDrugTerritory[] = [
      {
        name: "Downtown",
        description: "The central business district with high visibility but good profits",
        profitModifier: 120,
        riskModifier: 150,
        reputationRequired: 0,
      },
      {
        name: "The Projects",
        description: "Low-income housing area with established drug trade",
        profitModifier: 90,
        riskModifier: 110,
        reputationRequired: 100,
      },
      {
        name: "Warehouse District",
        description: "Industrial area with minimal police presence",
        profitModifier: 100,
        riskModifier: 80,
        reputationRequired: 300,
      },
      {
        name: "Nightclub Zone",
        description: "Entertainment district with high demand and high prices",
        profitModifier: 150,
        riskModifier: 120,
        reputationRequired: 600,
      },
      {
        name: "University Campus",
        description: "Academic area with wealthy students but tight security",
        profitModifier: 180,
        riskModifier: 140,
        reputationRequired: 1000,
      },
      {
        name: "Luxury Highrise",
        description: "Exclusive residential area with elite clientele",
        profitModifier: 200,
        riskModifier: 160,
        reputationRequired: 2000,
      },
    ];

    for (const territory of defaultTerritories) {
      await this.createTerritory(territory);
    }

    // Create drug recipes
    const allDrugs = await this.getAllDrugs();
    const allIngredients = await this.getAllIngredients();
    
    if (allDrugs.length > 0 && allIngredients.length > 0) {
      // Define recipes for each drug
      const recipes = [
        // Stardust (drug id 1)
        { drugId: 1, ingredientId: 1, quantity: 2 }, // Basic Chemical x2
        { drugId: 1, ingredientId: 3, quantity: 1 }, // Rare Extract x1
        
        // Shade (drug id 2)
        { drugId: 2, ingredientId: 1, quantity: 1 }, // Basic Chemical x1
        { drugId: 2, ingredientId: 2, quantity: 2 }, // Synthetic Compound x2
        
        // Titan (drug id 3)
        { drugId: 3, ingredientId: 2, quantity: 2 }, // Synthetic Compound x2
        { drugId: 3, ingredientId: 4, quantity: 1 }, // Crystalline Powder x1
        
        // Brainwave (drug id 4)
        { drugId: 4, ingredientId: 3, quantity: 2 }, // Rare Extract x2
        { drugId: 4, ingredientId: 5, quantity: 1 }, // Exotic Mineral x1
        
        // Fortunate (drug id 5)
        { drugId: 5, ingredientId: 4, quantity: 2 }, // Crystalline Powder x2
        { drugId: 5, ingredientId: 5, quantity: 1 }, // Exotic Mineral x1
        
        // Blend (drug id 6)
        { drugId: 6, ingredientId: 1, quantity: 1 }, // Basic Chemical x1
        { drugId: 6, ingredientId: 3, quantity: 1 }, // Rare Extract x1
        { drugId: 6, ingredientId: 5, quantity: 1 }, // Exotic Mineral x1
        
        // Phantom (drug id 7)
        { drugId: 7, ingredientId: 2, quantity: 1 }, // Synthetic Compound x1
        { drugId: 7, ingredientId: 5, quantity: 2 }, // Exotic Mineral x2
        
        // Kingmaker (drug id 8)
        { drugId: 8, ingredientId: 3, quantity: 1 }, // Rare Extract x1
        { drugId: 8, ingredientId: 4, quantity: 1 }, // Crystalline Powder x1
        { drugId: 8, ingredientId: 6, quantity: 2 }, // Forbidden Substance x2
      ];
      
      for (const recipe of recipes) {
        await this.createRecipe(recipe);
      }
    }
  }
}

export const drugStorage = new DrugStorage();