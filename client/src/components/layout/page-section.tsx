import React from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  actions?: React.ReactNode;
}

export function PageSection({
  title,
  description,
  children,
  className,
  titleClassName,
  descriptionClassName,
  contentClassName,
  actions,
}: PageSectionProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <div>
          <h2 className={cn("text-xl font-semibold", titleClassName)}>{title}</h2>
          {description && (
            <p className={cn("text-muted-foreground mt-1", descriptionClassName)}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 mt-2 sm:mt-0">{actions}</div>}
      </div>
      <div className={cn("mt-2", contentClassName)}>{children}</div>
    </div>
  );
}