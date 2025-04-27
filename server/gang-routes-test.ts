import express from "express";
import { testGangStorage } from "./gang-storage-test";
import { z } from "zod";

const router = express.Router();

// Create gang schema
const createGangSchema = z.object({
  name: z.string().min(3, "Gang name must be at least 3 characters").max(20, "Gang name must be at most 20 characters"),
  tag: z.string().min(2, "Gang tag must be at least 2 characters").max(5, "Gang tag must be at most 5 characters"),
  description: z.string().max(200, "Description must be at most 200 characters").optional(),
});

// Get all gangs
router.get("/", async (req, res) => {
  try {
    const gangs = await testGangStorage.getAllGangs();
    return res.json(gangs);
  } catch (error) {
    console.error("Error getting gangs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Create gang
router.post("/", async (req, res) => {
  try {
    console.log("[Test Gang Routes] Create gang request:", req.body);
    
    // Check if user is logged in
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a gang" });
    }
    
    // Validate request body
    const validationResult = createGangSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: validationResult.error.errors 
      });
    }
    
    // Get validated data
    const { name, tag, description } = validationResult.data;
    
    // Get user ID
    const userId = req.user.id;
    
    // Create gang
    const gang = await testGangStorage.createGang({
      name,
      tag,
      description,
      ownerId: userId
    });
    
    if (!gang) {
      return res.status(500).json({ message: "Failed to create gang" });
    }
    
    return res.status(201).json(gang);
  } catch (error) {
    console.error("Error creating gang:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;