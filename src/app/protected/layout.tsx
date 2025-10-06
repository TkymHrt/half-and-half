import type { ReactNode } from "react";

import { BottomNav } from "@/components/app/bottom-nav";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col">
        {children}
      </div>
      <BottomNav />
    </main>
  );
}
