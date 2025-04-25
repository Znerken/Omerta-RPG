import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader = ({
  title,
  description,
  className,
  icon,
  actions,
}: PageHeaderProps) => {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/20 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;