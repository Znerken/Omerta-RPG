import express, { Request, Response } from "express";
import { isAuthenticated, isAdmin } from "./middleware/auth";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { locationChallenges, locationProgress } from "@shared/schema";

const router = express.Router();

// Get all locations for the current user with progress
router.get("/locations", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userLocations = await storage.getUserLocationsWithProgress(req.user.id);
    res.json(userLocations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// Get a specific location by ID
router.get("/locations/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    const location = await storage.getLocationById(locationId);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    // Get user's progress for this location
    const progress = await storage.getLocationProgress(req.user.id, locationId);
    
    res.json({
      ...location,
      progress: progress || null
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

// Update user's current location (used for checking proximity to challenges)
router.post("/location/update", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      latitude: z.number(),
      longitude: z.number()
    });
    
    const validatedData = schema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: "Invalid location data", details: validatedData.error });
    }
    
    const { latitude, longitude } = validatedData.data;
    
    // Update user's location in storage
    await storage.updateUserLocation(req.user.id, latitude, longitude);
    
    // Find available challenges near this location
    const nearbyLocations = await storage.getNearbyLocations(req.user.id, latitude, longitude);
    
    res.json({
      updated: true,
      latitude,
      longitude,
      nearbyLocations
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Start a location-based challenge
router.post("/locations/:id/start", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    const location = await storage.getLocationById(locationId);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    // Check if location is unlocked for this user
    const userProgress = await storage.getLocationProgress(req.user.id, locationId);
    if (!location.unlocked && !userProgress?.unlocked) {
      return res.status(403).json({ error: "Location not unlocked" });
    }
    
    // Check if location is on cooldown
    if (userProgress?.last_completed) {
      const lastCompletedDate = new Date(userProgress.last_completed);
      const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
      const now = new Date();
      
      if (now.getTime() - lastCompletedDate.getTime() < cooldownMs) {
        const remainingMs = cooldownMs - (now.getTime() - lastCompletedDate.getTime());
        const remainingHrs = Math.ceil(remainingMs / (1000 * 60 * 60));
        
        return res.status(403).json({
          error: "Location on cooldown",
          remainingHours: remainingHrs
        });
      }
    }
    
    // Check user's current location is close enough to the challenge
    const userLocation = await storage.getUserLocation(req.user.id);
    if (!userLocation) {
      return res.status(400).json({ error: "User location not found" });
    }
    
    // Calculate distance between user and location (using Haversine formula)
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.latitude,
      location.longitude
    );
    
    // Check if user is within range (e.g., 1km)
    const MAX_DISTANCE_KM = 1;
    if (distance > MAX_DISTANCE_KM) {
      return res.status(403).json({
        error: "Too far from location",
        distance: distance,
        maxDistance: MAX_DISTANCE_KM
      });
    }
    
    // Start the challenge by creating or updating progress
    const progress = await storage.startLocationChallenge(req.user.id, locationId);
    
    res.json({
      success: true,
      location,
      progress
    });
  } catch (error) {
    console.error("Error starting location challenge:", error);
    res.status(500).json({ error: "Failed to start location challenge" });
  }
});

// Complete a location-based challenge
router.post("/locations/:id/complete", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    const location = await storage.getLocationById(locationId);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    // Check if the challenge has been started
    const progress = await storage.getLocationProgress(req.user.id, locationId);
    if (!progress || !progress.started_at) {
      return res.status(403).json({ error: "Challenge not started" });
    }
    
    // Complete the challenge and award rewards
    const result = await storage.completeLocationChallenge(req.user.id, locationId, location.rewards);
    
    res.json({
      success: true,
      rewards: location.rewards,
      ...result
    });
  } catch (error) {
    console.error("Error completing location challenge:", error);
    res.status(500).json({ error: "Failed to complete location challenge" });
  }
});

// ADMIN ROUTES

// Get all locations (admin only)
router.get("/admin/locations", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const locations = await storage.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching all locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// Create a new location (admin only)
router.post("/admin/locations", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string(),
      description: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      difficulty: z.string(),
      type: z.string(),
      rewards: z.object({
        cash: z.number(),
        xp: z.number(),
        respect: z.number(),
        special_item_id: z.number().nullable().optional()
      }),
      cooldown_hours: z.number(),
      unlocked: z.boolean().default(false),
      image_url: z.string().nullable().optional()
    });
    
    const validatedData = schema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: "Invalid location data", details: validatedData.error });
    }
    
    const location = await storage.createLocation(validatedData.data);
    
    res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: "Failed to create location" });
  }
});

// Update a location (admin only)
router.patch("/admin/locations/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      difficulty: z.string().optional(),
      type: z.string().optional(),
      rewards: z.object({
        cash: z.number(),
        xp: z.number(),
        respect: z.number(),
        special_item_id: z.number().nullable().optional()
      }).optional(),
      cooldown_hours: z.number().optional(),
      unlocked: z.boolean().optional(),
      image_url: z.string().nullable().optional()
    });
    
    const validatedData = schema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: "Invalid location data", details: validatedData.error });
    }
    
    const location = await storage.updateLocation(locationId, validatedData.data);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    res.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Delete a location (admin only)
router.delete("/admin/locations/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    
    const result = await storage.deleteLocation(locationId);
    
    if (!result) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ error: "Failed to delete location" });
  }
});

// Unlock a location for a user (admin only)
router.post("/admin/locations/:id/unlock", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const result = await storage.unlockLocationForUser(userId, locationId);
    
    res.json(result);
  } catch (error) {
    console.error("Error unlocking location:", error);
    res.status(500).json({ error: "Failed to unlock location" });
  }
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

export default router;