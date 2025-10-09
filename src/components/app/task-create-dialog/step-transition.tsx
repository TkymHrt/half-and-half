"use client";

import type { ReactNode } from "react";

export type StepTransitionProps = {
  step: number;
  children: ReactNode;
};

export function StepTransition({ step, children }: StepTransitionProps) {
  return (
    <div
      className="fade-in-0 slide-in-from-right-5 animate-in duration-200"
      key={step}
    >
      {children}
    </div>
  );
}
