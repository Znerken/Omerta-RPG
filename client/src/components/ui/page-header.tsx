import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  className,
  icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && (
            <div className="mr-3 bg-muted p-2 rounded-sm text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-heading">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="ml-auto flex gap-2">{actions}</div>}
      </div>
      <div className="h-px bg-gradient-to-r from-border/10 via-border/50 to-border/10 mt-4"></div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  className,
  icon,
  actions,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && (
            <div className="mr-2 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-heading">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      <div className="h-px bg-border mt-3"></div>
    </div>
  );
}