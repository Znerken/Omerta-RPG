import { Express } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, or, sql } from "drizzle-orm";
import { 
  insertFriendRequestSchema, 
  insertUserFriendSchema, 
  insertUserStatusSchema, 
  userFriends, 
  friendRequests, 
  users 
} from "@shared/schema";
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
  // IMPORTANT: The order of routes matters - more specific routes should come before more generic ones
  // For example, /api/social/users/search must come before /api/social/users/:userId

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

  // IMPORTANT: This specific route must come BEFORE the generic /:userId route!
  app.get("/api/social/users/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // Log all request details for debugging
      console.log('Search API called with params:', req.params);
      console.log('Search API called with query:', req.query);
      
      const searchQuery = req.query.q as string;
      
      if (!searchQuery || searchQuery.trim().length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      console.log(`Searching for users with query: "${searchQuery}"`);
      
      // Direct database query to find matching users
      const matchingUsers = await db
        .select({
          id: users.id,
          username: users.username,
          avatar: users.avatar,
        })
        .from(users)
        .where(
          sql`LOWER(${users.username}) LIKE LOWER(${'%' + searchQuery + '%'})`
        )
        .limit(10);
      
      console.log(`Found ${matchingUsers.length} users matching query:`, matchingUsers);
      
      if (matchingUsers.length === 0) {
        return res.json([]);
      }
      
      const currentUserId = req.user.id;
      
      // Get all friendship relations for the current user in a single query
      const friendships = await db
        .select()
        .from(userFriends)
        .where(
          or(
            eq(userFriends.userId, currentUserId),
            eq(userFriends.friendId, currentUserId)
          )
        );
      
      // Get all friend requests for the current user
      const friendRequests = await db
        .select()
        .from(friendRequests)
        .where(
          or(
            eq(friendRequests.senderId, currentUserId),
            eq(friendRequests.receiverId, currentUserId)
          )
        );
      
      console.log(`Found ${friendships.length} friendship records and ${friendRequests.length} friend requests for user ${currentUserId}`);
      
      // Map results to include friendship status
      const resultsWithFriendStatus = matchingUsers.map(user => {
        // Skip self
        if (user.id === currentUserId) {
          return null;
        }
        
        // Check if we're already friends
        const friendship = friendships.find(f => 
          (f.userId === currentUserId && f.friendId === user.id) ||
          (f.userId === user.id && f.friendId === currentUserId)
        );
        
        // Check if there's a friend request
        const request = friendRequests.find(r => 
          (r.senderId === currentUserId && r.receiverId === user.id) ||
          (r.senderId === user.id && r.receiverId === currentUserId)
        );
        
        // Determine friendship status
        const isFriend = !!friendship;
        let friendStatus = undefined;
        
        if (isFriend) {
          friendStatus = "friends";
        } else if (request) {
          // If there's a request, check if current user sent it or received it
          if (request.senderId === currentUserId) {
            friendStatus = "sent";
          } else {
            friendStatus = "received";
          }
        }
        
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isFriend,
          friendStatus,
          friendRequest: request,
          status: {
            id: 0,
            userId: user.id,
            status: "unknown", // We're not loading status here for performance
            lastActive: new Date(),
            lastLocation: null
          }
        };
      });
      
      // Filter out null results (self)
      const filteredResults = resultsWithFriendStatus.filter(u => u !== null);
      
      console.log('Returning search results:', filteredResults);
      res.json(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });
  
  // Get user profile with status information (includes friend status)
  app.get("/api/social/users/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const targetUserIdParam = req.params.userId;
      if (!targetUserIdParam || isNaN(parseInt(targetUserIdParam))) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const targetUserId = parseInt(targetUserIdParam);
      const currentUserId = req.user.id;
      
      // Skip friend status check if viewing own profile
      if (targetUserId === currentUserId) {
        const user = await storage.getUser(targetUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const status = await storage.getUserStatus(targetUserId) || {
          id: 0, // Placeholder ID for frontend
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
      
      try {
        const userWithStatus = await storage.getUserWithStatus(targetUserId, currentUserId);
        if (!userWithStatus) {
          return res.status(404).json({ message: "User not found" });
        }
        
        res.json(userWithStatus);
      } catch (error) {
        console.error("Error getting user with status:", error);
        
        // Fallback to basic user info without status if there's an error
        const user = await storage.getUser(targetUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        return res.json({
          ...user,
          status: {
            id: 0, // Placeholder ID for frontend
            userId: targetUserId,
            status: "offline",
            lastActive: new Date(),
            lastLocation: null
          },
          isFriend: false,
          friendStatus: null,
          friendRequest: null
        });
      }
    } catch (error) {
      console.error("Error getting user with status:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Send friend request
  app.post("/api/social/friends/request", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertFriendRequestSchema.parse({
        senderId: req.user.id,
        receiverId: req.body.receiverId,
        status: "pending",
        createdAt: new Date()
      });
      
      // Check if user exists
      const targetUser = await storage.getUser(validatedData.receiverId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if friend request already exists
      const existingRequest = await storage.getFriendRequest(validatedData.senderId, validatedData.receiverId);
      if (existingRequest) {
        return res.status(400).json({ 
          message: "Friend request already exists", 
          status: existingRequest.status 
        });
      }
      
      // Check for reverse friend request (they already sent a request to current user)
      const reverseRequest = await storage.getFriendRequest(validatedData.receiverId, validatedData.senderId);
      if (reverseRequest && reverseRequest.status === "pending") {
        // Auto-accept by using our new acceptFriendRequest function
        const result = await storage.acceptFriendRequest(reverseRequest.id);
        
        // Notify both users about the new friendship
        notifyUser(validatedData.senderId, "friend_accepted", {
          userId: validatedData.receiverId,
          username: targetUser.username,
          avatar: targetUser.avatar
        });
        
        notifyUser(validatedData.receiverId, "friend_accepted", {
          userId: validatedData.senderId,
          username: req.user.username,
          avatar: req.user.avatar
        });
        
        return res.status(200).json({
          message: "Friend request accepted automatically", 
          request: result.request,
          friendship: result.friendship
        });
      }
      
      // Create new friend request
      const friendRequest = await storage.sendFriendRequest(validatedData.senderId, validatedData.receiverId);
      
      // Notify the target user
      notifyUser(validatedData.receiverId, "friend_request", {
        requestId: friendRequest.id,
        from: {
          id: validatedData.senderId,
          username: req.user.username,
          avatar: req.user.avatar
        }
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
      if (friendRequest.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this request" });
      }
      
      if (status === "accepted") {
        // Accept the request - this creates the friendship record
        const result = await storage.acceptFriendRequest(requestId);
        
        // Notify the sender that request was accepted
        const sender = await storage.getUser(friendRequest.senderId);
        if (sender) {
          notifyUser(friendRequest.senderId, "friend_accepted", {
            userId: req.user.id,
            username: req.user.username,
            avatar: req.user.avatar
          });
        }
        
        return res.json({
          message: "Friend request accepted",
          request: result.request,
          friendship: result.friendship
        });
      } else {
        // Just update the request status (rejected or blocked)
        const updatedRequest = await storage.updateFriendRequest(requestId, status);
        
        // Could notify the sender that request was rejected, but it's not always necessary
        
        res.json({
          message: `Friend request ${status}`,
          request: updatedRequest
        });
      }
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
      notifyUser(friendId, "friend_removed", {
        userId: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar
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
        notifyUser(friend.id, "friend_status", {
          userId: req.user.id,
          username: req.user.username,
          avatar: req.user.avatar,
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
  

}