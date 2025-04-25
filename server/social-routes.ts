import { Express } from "express";
import { storage } from "./storage";
import { insertUserFriendSchema, insertUserStatusSchema } from "@shared/schema";
import { z } from "zod";

// Get reference to the notifyUser function from routes.ts
let notifyUserFn: (userId: number, event: string, data: any) => void;

export function setNotifyUserFunction(fn: (userId: number, event: string, data: any) => void) {
  notifyUserFn = fn;
}

// Wrapper function to safely call notifyUser
function notifyUser(userId: number, event: string, data: any) {
  if (notifyUserFn) {
    notifyUserFn(userId, event, data);
  } else {
    console.warn('notifyUser function not set yet');
  }
}

export function registerSocialRoutes(app: Express) {
  // Get user friends
  app.get("/api/social/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const userId = req.user.id;
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({ message: "Failed to get friends" });
    }
  });
  
  // Get user profile with status information (includes friend status)
  app.get("/api/social/users/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const targetUserId = parseInt(req.params.userId);
      const currentUserId = req.user.id;
      
      // Skip friend status check if viewing own profile
      if (targetUserId === currentUserId) {
        const user = await storage.getUser(targetUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const status = await storage.getUserStatus(targetUserId) || {
          userId: targetUserId,
          status: "offline",
          lastActive: new Date(),
          lastLocation: null
        };
        
        return res.json({
          ...user,
          status,
          isFriend: false,
          friendStatus: null,
          friendRequest: null
        });
      }
      
      const userWithStatus = await storage.getUserWithStatus(targetUserId, currentUserId);
      if (!userWithStatus) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(userWithStatus);
    } catch (error) {
      console.error("Error getting user with status:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Send friend request
  app.post("/api/social/friends/request", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertUserFriendSchema.parse({
        userId: req.user.id,
        friendId: req.body.friendId,
        status: "pending"
      });
      
      // Check if user exists
      const targetUser = await storage.getUser(validatedData.friendId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if friend request already exists
      const existingRequest = await storage.getFriendRequest(validatedData.userId, validatedData.friendId);
      if (existingRequest) {
        return res.status(400).json({ 
          message: "Friend request already exists", 
          status: existingRequest.status 
        });
      }
      
      // Check for reverse friend request (they already sent a request to current user)
      const reverseRequest = await storage.getFriendRequest(validatedData.friendId, validatedData.userId);
      if (reverseRequest && reverseRequest.status === "pending") {
        // Auto-accept the reverse request rather than creating a new one
        const acceptedRequest = await storage.updateFriendRequest(reverseRequest.id, "accepted");
        
        // Notify both users about the new friendship
        notifyUser(validatedData.userId, "friendRequestAccepted", {
          requestId: reverseRequest.id,
          friendId: validatedData.friendId,
          friendName: targetUser.username
        });
        
        notifyUser(validatedData.friendId, "friendRequestAccepted", {
          requestId: reverseRequest.id,
          friendId: validatedData.userId,
          friendName: req.user.username
        });
        
        return res.status(200).json({
          message: "Friend request accepted automatically", 
          request: acceptedRequest
        });
      }
      
      // Create new friend request
      const friendRequest = await storage.sendFriendRequest(validatedData.userId, validatedData.friendId);
      
      // Notify the target user
      notifyUser(validatedData.friendId, "friendRequest", {
        requestId: friendRequest.id,
        fromUserId: validatedData.userId,
        fromUsername: req.user.username
      });
      
      res.status(201).json(friendRequest);
    } catch (error) {
      console.error("Error sending friend request:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });
  
  // Accept/reject friend request
  app.put("/api/social/friends/request/:requestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const requestId = parseInt(req.params.requestId);
      const { status } = req.body;
      
      if (!status || !["accepted", "rejected", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the friend request
      const friendRequest = await storage.getFriendRequest(null, null, requestId);
      if (!friendRequest) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      
      // Verify the current user is the recipient of the request
      if (friendRequest.friendId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this request" });
      }
      
      // Update the request status
      const updatedRequest = await storage.updateFriendRequest(requestId, status);
      
      // If request accepted, notify the sender
      if (status === "accepted") {
        const sender = await storage.getUser(friendRequest.userId);
        if (sender) {
          notifyUser(friendRequest.userId, "friendRequestAccepted", {
            requestId,
            friendId: req.user.id,
            friendName: req.user.username
          });
        }
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating friend request:", error);
      res.status(500).json({ message: "Failed to update friend request" });
    }
  });
  
  // Remove friend
  app.delete("/api/social/friends/:friendId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const userId = req.user.id;
      const friendId = parseInt(req.params.friendId);
      
      const removed = await storage.removeFriend(userId, friendId);
      
      if (!removed) {
        return res.status(404).json({ message: "Friend relationship not found" });
      }
      
      // Notify the removed friend
      notifyUser(friendId, "friendRemoved", {
        userId: req.user.id,
        username: req.user.username
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });
  
  // Update user status
  app.post("/api/social/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { status, lastLocation } = req.body;
      
      if (!status || !["online", "offline", "away", "busy"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Check if user already has a status record
      let userStatus = await storage.getUserStatus(req.user.id);
      
      if (userStatus) {
        // Update existing status
        userStatus = await storage.updateUserStatus(req.user.id, {
          status,
          lastActive: new Date(),
          lastLocation: lastLocation || userStatus.lastLocation
        });
      } else {
        // Create new status
        const validatedData = insertUserStatusSchema.parse({
          userId: req.user.id,
          status,
          lastLocation
        });
        
        userStatus = await storage.createUserStatus(validatedData);
      }
      
      // Get user's friends to notify them about status change
      const friends = await storage.getUserFriends(req.user.id);
      
      // Notify friends of status change
      friends.forEach(friend => {
        notifyUser(friend.id, "friendStatusChanged", {
          userId: req.user.id,
          username: req.user.username,
          status
        });
      });
      
      res.json(userStatus);
    } catch (error) {
      console.error("Error updating user status:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to update status" });
    }
  });
  
  // Get online users (friends only or all if admin)
  app.get("/api/social/online", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // If user is admin, return all online users
      if (req.user.isAdmin) {
        const onlineUsers = await storage.getOnlineUsers();
        return res.json(onlineUsers);
      }
      
      // Otherwise return only friends who are online
      const friends = await storage.getUserFriends(req.user.id);
      const onlineFriends = friends.filter(friend => 
        friend.status && friend.status.status === "online"
      );
      
      res.json(onlineFriends);
    } catch (error) {
      console.error("Error getting online users:", error);
      res.status(500).json({ message: "Failed to get online users" });
    }
  });
  
  // Search for users by username
  app.get("/api/social/users/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const searchQuery = req.query.q as string;
      
      if (!searchQuery || searchQuery.trim().length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      // Get users matching the search query
      const users = await storage.getAllUsers(1, 10, searchQuery);
      const currentUserId = req.user.id;
      
      // For each user, check if they are already a friend
      const resultsWithFriendStatus = await Promise.all(users.map(async (user) => {
        // Skip self in results
        if (user.id === currentUserId) {
          return null;
        }
        
        // Check friendship status
        const userWithStatus = await storage.getUserWithStatus(user.id, currentUserId);
        
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isFriend: userWithStatus?.isFriend || false,
          friendStatus: userWithStatus?.friendStatus || null
        };
      }));
      
      // Filter out null results (self)
      const filteredResults = resultsWithFriendStatus.filter(u => u !== null);
      
      res.json(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });
}