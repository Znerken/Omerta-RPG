import React from "react";
import { cn } from "@/lib/utils";

// Common props for all icon components
interface MafiaIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "muted" | "white";
}

// Creates the base SVG element with consistent styling
function IconWrapper({
  children,
  className,
  size = "md",
  color = "primary",
  viewBox = "0 0 24 24",
}: MafiaIconProps & { children: React.ReactNode; viewBox?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    muted: "text-muted-foreground",
    white: "text-white",
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeClasses[size], colorClasses[color], className)}
    >
      {children}
    </svg>
  );
}

// Tommy Gun Icon
export function TommyGunIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <path d="M10 6L2 6C1.44772 6 1 6.44772 1 7V10C1 10.5523 1.44772 11 2 11H10" />
      <path d="M10 11V6" />
      <path d="M13 4L13 13" />
      <path d="M13 4L22 4L22 13L13 13" />
      <path d="M17 13L17 16" />
      <path d="M9 9H13" />
      <path d="M4 11L4 14" />
    </IconWrapper>
  );
}

// Fedora Hat Icon
export function FedoraIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <path d="M3 14C3 11.7909 4.79086 10 7 10H17C19.2091 10 21 11.7909 21 14V15C21 15.5523 20.5523 16 20 16H4C3.44772 16 3 15.5523 3 15V14Z" />
      <path d="M12 10C15.3137 10 18 7.31371 18 4H6C6 7.31371 8.68629 10 12 10Z" />
    </IconWrapper>
  );
}

// Brass Knuckles Icon
export function BrassKnucklesIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <path d="M5 10C5 8.89543 5.89543 8 7 8H17C18.1046 8 19 8.89543 19 10V12C19 13.1046 18.1046 14 17 14H7C5.89543 14 5 13.1046 5 12V10Z" />
      <path d="M7 14V17C7 17.5523 7.44772 18 8 18H9C9.55228 18 10 17.5523 10 17V14" />
      <path d="M10.5 14V17C10.5 17.5523 10.9477 18 11.5 18H12.5C13.0523 18 13.5 17.5523 13.5 17V14" />
      <path d="M14 14V17C14 17.5523 14.4477 18 15 18H16C16.5523 18 17 17.5523 17 17V14" />
    </IconWrapper>
  );
}

// Briefcase with Money Icon
export function MoneyBriefcaseIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M16 6V4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4V6" />
      <path d="M3 10H21" />
      <path d="M12 14C12 14 13 13.5 14 14C15 14.5 16 14 16 14" />
      <path d="M12 16C12 16 13 15.5 14 16C15 16.5 16 16 16 16" />
      <path d="M8 14H9" />
      <path d="M8 16H9" />
    </IconWrapper>
  );
}

// Pistol Icon
export function PistolIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <path d="M4 10H15L18 6H22V14H18L15 10" />
      <path d="M4 10V14H8V10" />
      <path d="M8 14L11 18H4L1 14" />
    </IconWrapper>
  );
}

// Handcuffs Icon
export function HandcuffsIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <circle cx="7" cy="14" r="3" />
      <circle cx="17" cy="14" r="3" />
      <path d="M10 14H14" />
      <path d="M7 11V7C7 5.89543 7.89543 5 9 5H15C16.1046 5 17 5.89543 17 7V11" />
    </IconWrapper>
  );
}

// Respect/Family Icon
export function FamilyIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="7" r="4" />
      <path d="M15.75 14H8.25C5.35 14 3 16.35 3 19.25V21H21V19.25C21 16.35 18.65 14 15.75 14Z" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="5" r="2" />
    </IconWrapper>
  );
}

// Safe/Vault Icon
export function VaultIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8V7" />
      <path d="M12 17V16" />
      <path d="M8 12H7" />
      <path d="M17 12H16" />
      <path d="M3 3L7 7" />
      <path d="M17 17L21 21" />
    </IconWrapper>
  );
}

// Whiskey Glass Icon
export function WhiskeyGlassIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <path d="M8 3H16L15 14H9L8 3Z" />
      <path d="M7 21H17" />
      <path d="M12 14V21" />
    </IconWrapper>
  );
}

// Cigar Icon
export function CigarIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <path d="M18 12H3" />
      <path d="M4 8H18C19.1046 8 20 8.89543 20 10V14C20 15.1046 19.1046 16 18 16H4C2.89543 16 2 15.1046 2 14V10C2 8.89543 2.89543 8 4 8Z" />
      <path d="M20 12H22" />
      <path d="M18 12C18 12 19 11 19 10" />
      <path d="M18 12C18 12 19 13 19 14" />
    </IconWrapper>
  );
}

// Target/Hit Icon
export function HitIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 3V6" />
      <path d="M12 18V21" />
      <path d="M3 12H6" />
      <path d="M18 12H21" />
      <path d="M19 19L21 21" />
    </IconWrapper>
  );
}

// Casino/Dice Icon
export function DiceIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
    </IconWrapper>
  );
}

// Police/Cop Icon
export function PoliceIcon(props: MafiaIconProps) {
  return (
    <IconWrapper {...props}>
      <path d="M12 2L14 6H19L15 9L16 14L12 11L8 14L9 9L5 6H10L12 2Z" />
      <path d="M12 11V21" />
      <path d="M8 16H16" />
    </IconWrapper>
  );
}