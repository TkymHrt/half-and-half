import type { CSSProperties, ReactNode } from "react";

import { BottomNav } from "@/components/app/bottom-nav";

const contentPaddingStyle: CSSProperties = {
  paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)",
};

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground">
      <div
        className="mx-auto flex min-h-screen w-full max-w-5xl flex-col"
        style={contentPaddingStyle}
      >
        {children}
      </div>
      <BottomNav />
    </main>
  );
}
