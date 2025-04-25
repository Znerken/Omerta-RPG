import { db } from "./db";
import { users, userStatus, userFriends } from "@shared/schema";
import { eq, and, or, desc, asc, isNull, ne } from "drizzle-orm";
import { UserWithStatus, UserStatus, UserFriend, InsertUserStatus } from "@shared/schema";

// Friend methods
export async function getUserFriends(userId: number): Promise<UserWithStatus[]> {
  // Find all accepted friend relationships (in either direction)
  const friendships = await db
    .select()
    .from(userFriends)
    .where(
      and(
        or(
          eq(userFriends.userId, userId),
          eq(userFriends.friendId, userId)
        ),
        eq(userFriends.status, "accepted")
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
      // @ts-ignore - type is correct
      userId => userId.in(users.id, friendIds)
    );

  // Format the results as UserWithStatus
  return friendUsers.map(({ user, status }) => {
    // Determine if they're a friend and the status of the friendship
    const friendship = friendships.find(fs => 
      fs.userId === user.id || fs.friendId === user.id
    );

    return {
      ...user,
      status: status || {
        userId: user.id,
        status: "offline",
        lastActive: new Date(),
        lastLocation: null
      },
      isFriend: true,
      friendStatus: "accepted",
      friendRequest: friendship
    };
  });
}

export async function getFriendRequest(
  userId: number | null, 
  friendId: number | null, 
  requestId?: number
): Promise<UserFriend | undefined> {
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
        .from(userFriends)
        .where(eq(userFriends.id, requestId));
      
      return request;
    } else if (userId && friendId) {
      // Find by user pair
      const [request] = await db
        .select()
        .from(userFriends)
        .where(
          and(
            eq(userFriends.userId, userId),
            eq(userFriends.friendId, friendId)
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
  userId: number, 
  friendId: number
): Promise<UserFriend> {
  const [request] = await db
    .insert(userFriends)
    .values({
      userId,
      friendId,
      status: "pending",
      createdAt: new Date()
    })
    .returning();
  
  return request;
}

export async function updateFriendRequest(
  requestId: number, 
  status: string
): Promise<UserFriend | undefined> {
  const [updated] = await db
    .update(userFriends)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(eq(userFriends.id, requestId))
    .returning();
  
  return updated;
}

export async function removeFriend(
  userId: number, 
  friendId: number
): Promise<boolean> {
  // Handle bidirectional friendship - could be stored in either direction
  const deleteResult = await db
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
  
  return true; // Drizzle doesn't return count info easily
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
  
  // Get friendship status (if any)
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
  
  const isFriend = friendship && friendship.status === "accepted";
  
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
    friendStatus: friendship ? friendship.status : null,
    friendRequest: friendship || null
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
    friendStatus: null,
    friendRequest: null
  }));
}