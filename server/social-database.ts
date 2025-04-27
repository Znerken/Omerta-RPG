import { db } from "./db";
import { users, userStatus, userFriends, friendRequests } from "@shared/schema";
import { eq, and, or, desc, asc, isNull, ne, sql } from "drizzle-orm";
import { UserWithStatus, UserStatus, UserFriend, FriendRequest, InsertUserStatus, InsertFriendRequest, InsertUserFriend, User } from "@shared/schema";

// Get user by ID
export async function getUser(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || undefined;
}

// Friend methods
export async function getUserFriends(userId: number): Promise<UserWithStatus[]> {
  if (isNaN(userId)) {
    console.error("Invalid userId in getUserFriends:", userId);
    return [];
  }

  try {
    // Find all friendships (in either direction)
    const friendships = await db
      .select()
      .from(userFriends)
      .where(
        or(
          eq(userFriends.userId, userId),
          eq(userFriends.friendId, userId)
        )
      );

    if (!friendships.length) {
      return [];
    }

    // Extract all friend IDs (might be in userId or friendId field)
    const friendIds = friendships.map(fs => 
      fs.userId === userId ? fs.friendId : fs.userId
    );

    // Get all friend users with their status
    const friendUsers = await db
      .select({
        user: users,
        status: userStatus
      })
      .from(users)
      .leftJoin(userStatus, eq(users.id, userStatus.userId))
      .where(
        // Only include users in the friend IDs list
        friendIds.length > 0 
          ? sql`${users.id} IN (${sql.join(friendIds.map(id => sql`${id}`), sql`, `)})` 
          : undefined
      );

    // Format the results as UserWithStatus
    // In getUserFriends we don't need to check for pending requests
    // since all users are confirmed friends
    return friendUsers.map(({ user, status }) => {
      return {
        ...user,
        status: status || {
          id: 0, // Placeholder ID for frontend
          userId: user.id,
          status: "offline",
          lastActive: new Date(),
          lastLocation: null
        },
        isFriend: true,
        friendStatus: "friends", // All users are confirmed friends
        friendRequest: undefined // No need for request info on confirmed friends
      };
    });
  } catch (error) {
    console.error("Error in getUserFriends:", error);
    return [];
  }
}

export async function getFriendRequest(
  userId: number | null, 
  friendId: number | null, 
  requestId?: number
): Promise<FriendRequest | undefined> {
  try {
    // Validate inputs
    if (requestId !== undefined && isNaN(requestId)) {
      console.error(`Invalid requestId in getFriendRequest: ${requestId}`);
      return undefined;
    }
    
    if (userId !== null && isNaN(userId as number)) {
      console.error(`Invalid userId in getFriendRequest: ${userId}`);
      return undefined;
    }
    
    if (friendId !== null && isNaN(friendId as number)) {
      console.error(`Invalid friendId in getFriendRequest: ${friendId}`);
      return undefined;
    }
    
    if (requestId) {
      // Find by ID
      const [request] = await db
        .select()
        .from(friendRequests)
        .where(eq(friendRequests.id, requestId));
      
      return request;
    } else if (userId && friendId) {
      // Find by user pair (check both directions)
      const [request] = await db
        .select()
        .from(friendRequests)
        .where(
          or(
            and(
              eq(friendRequests.senderId, userId),
              eq(friendRequests.receiverId, friendId)
            ),
            and(
              eq(friendRequests.senderId, friendId),
              eq(friendRequests.receiverId, userId)
            )
          )
        );
      
      return request;
    }
  } catch (error) {
    console.error("Error in getFriendRequest:", error);
  }
  
  return undefined;
}

export async function sendFriendRequest(
  senderId: number, 
  receiverId: number
): Promise<FriendRequest> {
  const [request] = await db
    .insert(friendRequests)
    .values({
      senderId,
      receiverId,
      status: "pending",
      createdAt: new Date()
    })
    .returning();
  
  return request;
}

export async function updateFriendRequest(
  requestId: number, 
  status: string
): Promise<FriendRequest | undefined> {
  const [updated] = await db
    .update(friendRequests)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(eq(friendRequests.id, requestId))
    .returning();
  
  return updated;
}

// Accept a friend request and create friendship
export async function acceptFriendRequest(requestId: number): Promise<{ request: FriendRequest, friendship: UserFriend }> {
  // 1. Update the request status to 'accepted'
  const [updatedRequest] = await db
    .update(friendRequests)
    .set({ 
      status: "accepted",
      updatedAt: new Date()
    })
    .where(eq(friendRequests.id, requestId))
    .returning();
  
  if (!updatedRequest) {
    throw new Error(`Friend request with ID ${requestId} not found`);
  }
  
  // Handle both column name conventions
  const senderIdValue = updatedRequest.sender_id !== undefined ? 
                       updatedRequest.sender_id : updatedRequest.senderId;
                       
  const receiverIdValue = updatedRequest.receiver_id !== undefined ? 
                         updatedRequest.receiver_id : updatedRequest.receiverId;
  
  // 2. Create the friendship record
  const [friendship] = await db
    .insert(userFriends)
    .values({
      userId: senderIdValue,
      friendId: receiverIdValue,
      createdAt: new Date()
    })
    .returning();
  
  return { request: updatedRequest, friendship };
}

export async function removeFriend(
  userId: number, 
  friendId: number
): Promise<boolean> {
  // 1. Delete any friend requests between these users
  await db
    .delete(friendRequests)
    .where(
      or(
        and(
          eq(friendRequests.senderId, userId),
          eq(friendRequests.receiverId, friendId)
        ),
        and(
          eq(friendRequests.senderId, friendId),
          eq(friendRequests.receiverId, userId)
        )
      )
    );
  
  // 2. Delete the friendship
  await db
    .delete(userFriends)
    .where(
      or(
        and(
          eq(userFriends.userId, userId),
          eq(userFriends.friendId, friendId)
        ),
        and(
          eq(userFriends.userId, friendId),
          eq(userFriends.friendId, userId)
        )
      )
    );
  
  return true;
}

// Get pending friend requests for a user
export async function getPendingFriendRequests(userId: number): Promise<FriendRequest[]> {
  const requests = await db
    .select()
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, "pending")
      )
    );
  
  // Map results to convert from snake_case to camelCase if needed
  return requests.map(request => {
    if (request.sender_id !== undefined && request.receiver_id !== undefined) {
      return {
        ...request,
        senderId: request.sender_id,
        receiverId: request.receiver_id
      };
    }
    return request;
  });
}

// Get sent friend requests by a user
export async function getSentFriendRequests(userId: number): Promise<FriendRequest[]> {
  const requests = await db
    .select()
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.senderId, userId),
        eq(friendRequests.status, "pending")
      )
    );
  
  // Map results to convert from snake_case to camelCase if needed
  return requests.map(request => {
    if (request.sender_id !== undefined && request.receiver_id !== undefined) {
      return {
        ...request,
        senderId: request.sender_id,
        receiverId: request.receiver_id
      };
    }
    return request;
  });
}

// Status methods
export async function getUserStatus(userId: number): Promise<UserStatus | undefined> {
  const [status] = await db
    .select()
    .from(userStatus)
    .where(eq(userStatus.userId, userId));
  
  return status;
}

export async function getUserWithStatus(
  targetUserId: number, 
  currentUserId: number
): Promise<UserWithStatus | undefined> {
  if (isNaN(targetUserId) || isNaN(currentUserId)) {
    throw new Error(`Invalid user IDs: targetUserId=${targetUserId}, currentUserId=${currentUserId}`);
  }

  // Get user and their status
  const [userResult] = await db
    .select({
      user: users,
      status: userStatus
    })
    .from(users)
    .leftJoin(userStatus, eq(users.id, userStatus.userId))
    .where(eq(users.id, targetUserId));
  
  if (!userResult) {
    return undefined;
  }
  
  // Check if they are friends
  const [friendship] = await db
    .select()
    .from(userFriends)
    .where(
      or(
        and(
          eq(userFriends.userId, currentUserId),
          eq(userFriends.friendId, targetUserId)
        ),
        and(
          eq(userFriends.userId, targetUserId),
          eq(userFriends.friendId, currentUserId)
        )
      )
    );
  
  // Check if there's a friend request
  const [friendRequest] = await db
    .select()
    .from(friendRequests)
    .where(
      or(
        and(
          eq(friendRequests.senderId, currentUserId),
          eq(friendRequests.receiverId, targetUserId)
        ),
        and(
          eq(friendRequests.senderId, targetUserId),
          eq(friendRequests.receiverId, currentUserId)
        )
      )
    );
  
  const isFriend = !!friendship; // Existence of friendship record means they are friends
  let friendStatus = undefined;
  
  if (isFriend) {
    friendStatus = "friends";
  } else if (friendRequest) {
    // If there's a friend request, use its status
    // Handle both column name conventions (senderId vs sender_id)
    const senderIdValue = friendRequest.sender_id !== undefined ? 
                           friendRequest.sender_id : friendRequest.senderId;
    
    if (senderIdValue === currentUserId) {
      friendStatus = "sent";
    } else {
      friendStatus = "received";
    }
  }
  
  return {
    ...userResult.user,
    status: userResult.status || {
      id: 0, // Placeholder ID for frontend
      userId: targetUserId,
      status: "offline",
      lastActive: new Date(),
      lastLocation: null
    },
    isFriend,
    friendStatus,
    friendRequest: friendRequest
  };
}

export async function createUserStatus(status: InsertUserStatus): Promise<UserStatus> {
  const [newStatus] = await db
    .insert(userStatus)
    .values({
      ...status,
      lastActive: new Date()
    })
    .returning();
  
  return newStatus;
}

export async function updateUserStatus(
  userId: number, 
  statusData: Partial<UserStatus>
): Promise<UserStatus | undefined> {
  const [updated] = await db
    .update(userStatus)
    .set(statusData)
    .where(eq(userStatus.userId, userId))
    .returning();
  
  return updated;
}

export async function getOnlineUsers(limit: number = 50): Promise<UserWithStatus[]> {
  const onlineUsers = await db
    .select({
      user: users,
      status: userStatus
    })
    .from(userStatus)
    .innerJoin(users, eq(userStatus.userId, users.id))
    .where(
      and(
        eq(userStatus.status, "online"),
        // Only include users active in the last hour
        ne(userStatus.lastActive, null)
      )
    )
    .orderBy(desc(userStatus.lastActive))
    .limit(limit);
  
  return onlineUsers.map(({ user, status }) => ({
    ...user,
    status,
    isFriend: false, // Cannot determine from this query
    friendStatus: undefined, // Set to undefined to match our updated type
    friendRequest: undefined // Set to undefined to match our updated type
  }));
}