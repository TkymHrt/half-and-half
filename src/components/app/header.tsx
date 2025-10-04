'use client';

import { useAppStore } from "@/lib/store/app-store";
import { type ReactNode } from "react";

export function AppHeader({
  action,
}: {
  action?: ReactNode;
}) {
  const currentTitle = useAppStore((state) => state.currentTitle);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
      <div className="text-lg font-semibold">{currentTitle}</div>
      <div>{action}</div>
    </header>
  );
}