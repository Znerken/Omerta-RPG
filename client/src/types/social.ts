// Social types for the friend system

export interface UserStatus {
  id: number;
  userId: number;
  status: string;
  lastActive: Date | string;
  lastLocation: string | null;
}

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export interface Friend {
  id: number;
  username: string;
  avatar: string | null;
  status?: UserStatus | null;
  friendStatus?: string;
  friendRequest?: FriendRequest | null;
  level?: number;
  createdAt?: Date | string | null;
}

export interface PendingFriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  username: string;
  avatar: string | null;
  level?: number;
  createdAt: Date | string | null;
}

export interface SentFriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  username: string;
  avatar: string | null;
  level?: number;
  createdAt: Date | string | null;
}