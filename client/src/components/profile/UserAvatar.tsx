import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { AvatarFrame } from "@/components/profile/ProfileCustomization";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username?: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | number;
  linkToProfile?: boolean;
  withBorder?: boolean;
  withRing?: boolean;
  borderColor?: string;
  ringColor?: string;
  className?: string;
  frame?: AvatarFrame;
  user?: any; // For passing a user object directly
}

// Get user initials for the avatar fallback
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export function UserAvatar({
  username,
  avatarUrl,
  size = "md",
  linkToProfile = true,
  withBorder = true,
  withRing = false,
  borderColor = "border-background",
  ringColor = "ring-primary/20",
  className = "",
  frame,
  user
}: UserAvatarProps) {
  // If user object is provided, extract username and avatarUrl from it
  const actualUsername = user?.username || username || "User";
  const actualAvatarUrl = user?.avatar || avatarUrl || null;

  // Define size classes
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-20 w-20 text-2xl",
    xl: "h-32 w-32 text-4xl",
  };

  // Create custom size class if size is a number
  let sizeClass = "";
  if (typeof size === "number") {
    sizeClass = `h-[${size}px] w-[${size}px] text-[${Math.max(16, size / 3)}px]`;
  } else {
    sizeClass = sizeClasses[size] || sizeClasses.md;
  }

  // Compose class names based on if we have a frame or default styling
  const avatarClasses = cn(
    sizeClass,
    frame 
      ? "" // When using a frame, let the frame control the border
      : cn(
          withBorder ? `border-2 ${borderColor}` : "",
          withRing ? `ring-2 ${ringColor}` : "",
        ),
    "omerta-profile-avatar", // Add our 3D effect class
    className
  );

  // Create the avatar content (either image or fallback)
  const avatarContent = (
    <Avatar className={avatarClasses}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={username} />
      ) : (
        <AvatarFallback className="font-heading bg-primary/20">
          {getInitials(username)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  // If we have a frame, wrap the avatar with the frame styling
  const avatarWithEffects = frame ? (
    <div className="relative group perspective-1000">
      {/* Apply frame borders and effects */}
      <div className={cn(
        "absolute -inset-1 rounded-full z-0",
        frame.border,
        frame.glow,
        frame.animation
      )}></div>
      
      {/* Avatar content */}
      <div className="relative z-10">
        {avatarContent}
      </div>
      
      {/* Add any special frame effects */}
      {frame.effects?.includes('flame-effect') && (
        <div className="absolute -inset-2 rounded-full flame-effect z-0 opacity-70"></div>
      )}
      
      {frame.effects?.includes('electric-effect') && (
        <div className="absolute -inset-2 rounded-full electric-effect z-0 opacity-70"></div>
      )}
      
      {/* Spotlight effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-secondary/0 to-secondary/20 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 z-20 pointer-events-none"></div>
    </div>
  ) : (
    <div className="relative group perspective-1000">
      {avatarContent}
      
      {/* Animated ring effect */}
      {withRing && (
        <div className="omerta-profile-avatar-ring opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
      
      {/* Spotlight effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-secondary/0 to-secondary/20 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 z-10 pointer-events-none"></div>
    </div>
  );

  const avatar = avatarWithEffects;

  // Wrap in a link if linkToProfile is true
  if (linkToProfile) {
    return <Link href={`/profile`}>{avatar}</Link>;
  }

  return avatar;
}