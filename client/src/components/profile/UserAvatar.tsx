import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  linkToProfile?: boolean;
  withBorder?: boolean;
  withRing?: boolean;
  borderColor?: string;
  ringColor?: string;
  className?: string;
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
}: UserAvatarProps) {
  // Define size classes
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-20 w-20 text-2xl",
    xl: "h-32 w-32 text-4xl",
  };

  // Compose class names
  const avatarClasses = [
    sizeClasses[size],
    withBorder ? `border-2 ${borderColor}` : "",
    withRing ? `ring-2 ${ringColor}` : "",
    "omerta-profile-avatar", // Add our new 3D effect class
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const avatar = (
    <div className="relative group perspective-1000">
      <Avatar className={avatarClasses}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={username} />
        ) : (
          <AvatarFallback className="font-heading bg-primary/20">
            {getInitials(username)}
          </AvatarFallback>
        )}
      </Avatar>
      
      {/* Animated ring effect */}
      {withRing && (
        <div className="omerta-profile-avatar-ring opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
      
      {/* Spotlight effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-secondary/0 to-secondary/20 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 z-10 pointer-events-none"></div>
    </div>
  );

  // Wrap in a link if linkToProfile is true
  if (linkToProfile) {
    return <Link href={`/profile`}>{avatar}</Link>;
  }

  return avatar;
}