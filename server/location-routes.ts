import { Router } from "express";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { locationChallenges, locationProgress } from "@shared/schema";
import { db } from "./db";

const router = Router();

// Create a specific router for location-based routes
const locationRoutes = Router();
router.use('/locations', locationRoutes);

export default router;

// Fetch all locations with progress for current user
locationRoutes.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const locationsWithProgress = await storage.getUserLocationsWithProgress(req.user.id);
    
    // Map the DB model to expected frontend model
    const mappedLocations = locationsWithProgress.map(location => ({
      id: location.id,
      name: location.name,
      description: location.description,
      latitude: location.latitude,
      longitude: location.longitude,
      type: location.type,
      difficulty: location.difficulty,
      rewards: {
        cash: location.cash_reward,
        xp: location.xp_reward,
        respect: location.respect_reward,
        special_item_id: location.special_item_id,
      },
      cooldown_hours: location.cooldown_hours,
      unlocked: location.unlocked,
      image_url: location.image_url,
      last_completed: location.last_completed,
    }));

    res.json(mappedLocations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Error fetching locations" });
  }
});

// Get a specific location
locationRoutes.get("/:id", async (req, res) => {
  try {
    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    const location = await storage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Error fetching location" });
  }
});

// Get progress for a specific location
locationRoutes.get("/:id/progress", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    const progress = await storage.getLocationProgress(req.user.id, locationId);
    if (!progress) {
      return res.json({ exists: false });
    }

    res.json(progress);
  } catch (error) {
    console.error("Error fetching location progress:", error);
    res.status(500).json({ error: "Error fetching location progress" });
  }
});

// Update user location
locationRoutes.post("/update", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    // Update user location
    const location = await storage.updateUserLocation(req.user.id, latitude, longitude);
    
    // Get nearby locations (within 1km radius)
    const nearbyLocations = await storage.getNearbyLocations(req.user.id, latitude, longitude, 1);
    
    res.json({ success: true, location, nearbyLocations });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Error updating location" });
  }
});

// Get a specific location with details
locationRoutes.get("/:id/details", async (req, res) => {
  try {
    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    const location = await storage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // If user is authenticated, get progress
    let progress = null;
    if (req.isAuthenticated()) {
      progress = await storage.getLocationProgress(req.user.id, locationId);
    }

    res.json({ location, progress });
  } catch (error) {
    console.error("Error fetching location details:", error);
    res.status(500).json({ error: "Error fetching location details" });
  }
});

// Get user's current location
locationRoutes.get("/user/current", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const location = await storage.getUserLocation(req.user.id);
    if (!location) {
      return res.status(404).json({ error: "User location not found" });
    }

    res.json(location);
  } catch (error) {
    console.error("Error fetching user location:", error);
    res.status(500).json({ error: "Error fetching user location" });
  }
});

// Start a location challenge
locationRoutes.post("/:id/start", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    // Check if location exists
    const location = await storage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Check if user is close enough to the location (must be within 1km)
    const userLocation = await storage.getUserLocation(req.user.id);
    if (!userLocation) {
      return res.status(400).json({ error: "User location not found" });
    }

    // Calculate distance
    const R = 6371; // Radius of the Earth in km
    const dLat = (location.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (location.longitude - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    const MAX_DISTANCE = 1; // 1km max distance
    if (distance > MAX_DISTANCE) {
      return res.status(400).json({ 
        error: "Too far from location", 
        distance, 
        maxDistance: MAX_DISTANCE 
      });
    }

    // Check if user has existing progress
    const progress = await storage.getLocationProgress(req.user.id, locationId);
    
    // Check for cooldown
    if (progress && progress.last_completed) {
      const lastCompleted = new Date(progress.last_completed);
      const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
      const now = new Date();
      
      if (now.getTime() - lastCompleted.getTime() < cooldownMs) {
        const remainingHours = Math.ceil((cooldownMs - (now.getTime() - lastCompleted.getTime())) / (1000 * 60 * 60));
        return res.status(400).json({ 
          error: "Location on cooldown", 
          remainingHours
        });
      }
    }

    // Start the challenge
    const updatedProgress = await storage.startLocationChallenge(req.user.id, locationId);
    
    res.json(updatedProgress);
  } catch (error) {
    console.error("Error starting location challenge:", error);
    res.status(500).json({ error: "Error starting location challenge" });
  }
});

// Complete a location challenge
locationRoutes.post("/:id/complete", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    // Check if location exists
    const location = await storage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Check if user has started the challenge
    const progress = await storage.getLocationProgress(req.user.id, locationId);
    if (!progress || !progress.started_at) {
      return res.status(400).json({ error: "Challenge not started" });
    }

    // Complete the challenge with rewards
    const rewards = {
      cash: location.cash_reward,
      xp: location.xp_reward,
      respect: location.respect_reward,
      special_item_id: location.special_item_id
    };

    const result = await storage.completeLocationChallenge(req.user.id, locationId, rewards);
    
    res.json({
      progress: result.progress,
      rewards
    });
  } catch (error) {
    console.error("Error completing location challenge:", error);
    res.status(500).json({ error: "Error completing location challenge" });
  }
});

// ADMIN ROUTES

// Get all locations (admin)
locationRoutes.get("/admin/all", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const locations = await storage.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching all locations:", error);
    res.status(500).json({ error: "Error fetching all locations" });
  }
});

// Create a new location (admin)
locationRoutes.post("/admin/create", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { 
      name, 
      description, 
      latitude, 
      longitude, 
      type, 
      difficulty, 
      cash_reward, 
      xp_reward, 
      respect_reward, 
      special_item_id, 
      image_url, 
      cooldown_hours,
      unlocked 
    } = req.body;

    // Validate required fields
    if (!name || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create the location
    const location = await storage.createLocation({
      name,
      description,
      latitude,
      longitude,
      type: type || "hideout",
      difficulty: difficulty || "easy",
      cash_reward: cash_reward || 100,
      xp_reward: xp_reward || 10,
      respect_reward: respect_reward || 5,
      special_item_id: special_item_id || null,
      image_url: image_url || null,
      cooldown_hours: cooldown_hours || 24,
      unlocked: unlocked !== undefined ? unlocked : true
    });

    res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: "Error creating location" });
  }
});

// Update a location (admin)
locationRoutes.put("/admin/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    // Update the location
    const location = await storage.updateLocation(locationId, req.body);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Error updating location" });
  }
});

// Delete a location (admin)
locationRoutes.delete("/admin/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const locationId = parseInt(req.params.id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    // Delete the location
    const success = await storage.deleteLocation(locationId);
    if (!success) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ error: "Error deleting location" });
  }
});

// Unlock a location for a user (admin)
locationRoutes.post("/admin/unlock/:id/user/:userId", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const locationId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (isNaN(locationId) || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid location ID or user ID" });
    }

    // Unlock the location for the user
    const progress = await storage.unlockLocationForUser(userId, locationId);
    
    res.json(progress);
  } catch (error) {
    console.error("Error unlocking location:", error);
    res.status(500).json({ error: "Error unlocking location" });
  }
});