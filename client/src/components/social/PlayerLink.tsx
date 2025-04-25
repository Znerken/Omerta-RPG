import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface PlayerLinkProps {
  userId: number;
  username: string;
  className?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

/**
 * PlayerLink - A component for displaying clickable user names that navigate to their profile
 * 
 * @param userId - The user's ID (required for linking to their profile)
 * @param username - The user's display name
 * @param className - Optional additional classes for styling
 * @param showIcon - Whether to show a small icon beside the username
 * @param onClick - Optional click handler (in addition to navigation)
 */
export function PlayerLink({ 
  userId, 
  username, 
  className, 
  showIcon = false,
  onClick
}: PlayerLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Allow the parent component to handle the click as well
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link 
      href={`/player/${userId}`}
      onClick={handleClick}
      className={cn(
        "text-primary hover:text-primary/80 font-medium hover:underline cursor-pointer",
        className
      )}
    >
      {showIcon && <span className="mr-1 text-xs">👤</span>}
      {username}
    </Link>
  );
}