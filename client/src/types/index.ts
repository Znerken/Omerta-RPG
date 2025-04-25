// User types
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string | null;
  cash: number;
  bank: number;
  level: number;
  experience: number;
  strength: number;
  defense: number;
  stealth: number;
  charisma: number;
  intelligence: number;
  stamina: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  createdAt: Date | null;
}

// Status types
export interface UserStatus {
  id: number;
  userId: number;
  status: string;
  lastActive: Date | null;
  lastLocation: string | null;
}

// Friend request types
export interface FriendRequest {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  createdAt: Date | null;
}

// Friend types
export interface Friend {
  id: number;
  username: string;
  avatar: string | null;
  status: {
    id: number;
    userId: number;
    status: string;
    lastActive: Date | null;
    lastLocation: string | null;
  };
  isFriend: boolean;
  friendStatus?: string;
  friendRequest?: FriendRequest;
}

// User with status
export interface UserWithStatus {
  id: number;
  username: string;
  avatar: string | null;
  status: UserStatus;
  isFriend: boolean;
  friendStatus?: string;
  friendRequest?: FriendRequest;
}

// Notification types
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  data?: any;
}