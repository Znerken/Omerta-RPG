import React from "react";
import { cn } from "@/lib/utils";

type IconProps = {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "muted" | "destructive";
  className?: string;
};

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const colorMap = {
  primary: "text-primary",
  secondary: "text-secondary",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
};

export const TommyGunIcon = ({
  size = "md",
  color = "muted",
  className,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], colorMap[color], className)}
    >
      <path d="M10 4V2" />
      <path d="M14 4V2" />
      <path d="M13 15v-2" />
      <path d="M4 22V4c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v18l-4-4H6a2 2 0 0 1-2 2v0z" />
      <path d="m15 13-2 2 2 2 4-4-3-3-1 1" />
      <path d="M7 9h.01" />
    </svg>
  );
};

export const FedoraIcon = ({
  size = "md",
  color = "muted",
  className,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], colorMap[color], className)}
    >
      <path d="M3 10c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" />
      <path d="M3 10c0 2.2 3.6 4 8 4s8-1.8 8-4" />
      <path d="M2 6.5C3 6 5 5 8 5c5 0 8.5 1.8 11 5.5" />
    </svg>
  );
};

export const MoneyBriefcaseIcon = ({
  size = "md",
  color = "muted",
  className,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], colorMap[color], className)}
    >
      <path d="M20 7h-3a2 2 0 0 1-2-2V3a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2H2a2 2 0 0 0-2 2v5c0 1.1.9 2 2 2h6v-1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
      <path d="M12 12a2 2 0 0 0 0 4 2 2 0 0 0 0-4z"/>
      <path d="M9 16v6"/>
      <path d="M15 16v6"/>
      <path d="M9 22h6"/>
    </svg>
  );
};

export const RevolverIcon = ({
  size = "md",
  color = "muted",
  className,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], colorMap[color], className)}
    >
      <path d="M8 6h12l-3 3H5l3-3Z" />
      <path d="m5 9 0 9" />
      <path d="M5 18h12a2 2 0 0 0 2-2v-1.4a2 2 0 0 0-.6-1.4l-.7-.7a2 2 0 0 1-.7-1.4V9" />
      <path d="M11 12h.01" />
      <path d="M13 12h.01" />
      <path d="M15 12h.01" />
      <path d="M17 12h.01" />
      <path d="M2 19h3" />
      <path d="M5 15v4" />
      <path d="M3.5 15H9" />
    </svg>
  );
};

export const DiceIcon = ({
  size = "md",
  color = "muted",
  className,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], colorMap[color], className)}
    >
      <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
      <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
      <path d="M6 18h.01" />
      <path d="M10 14h.01" />
      <path d="M15 6h.01" />
      <path d="M18 9h.01" />
    </svg>
  );
};

export const WhiskeyGlassIcon = ({
  size = "md",
  color = "muted",
  className,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], colorMap[color], className)}
    >
      <path d="M8 22h8" />
      <path d="M7 10h10" />
      <path d="M12 10v12" />
      <path d="M17 10 8 2" />
      <path d="m7 10 9-8" />
    </svg>
  );
};

export const FamilyIcon = ({
  size = "md",
  color = "muted",
  className,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], colorMap[color], className)}
    >
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c-1.35-3.76-4.6-6.5-8.5-6.5-.57 0-1.13.05-1.67.15" />
      <path d="M20 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
};