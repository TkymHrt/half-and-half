"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AppHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function AppHeader({
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-border/80 border-b bg-background/90 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1
              aria-live="polite"
              className="truncate font-semibold text-lg sm:text-xl"
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-muted-foreground text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction}
            {action}
          </div>
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </div>
    </header>
  );
}
