import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepperProps = {
  steps: readonly string[];
  currentStep: number;
  className?: string;
};

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* デスクトップ版：横並び */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div className="flex flex-1 items-center" key={label}>
                <div className="flex flex-col items-center gap-2">
                  {/* ステップサークル */}
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all",
                      {
                        "border-primary bg-primary text-primary-foreground":
                          isCurrent || isCompleted,
                        "border-muted-foreground/30 bg-muted text-muted-foreground":
                          isUpcoming,
                      }
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* ステップラベル */}
                  <span
                    className={cn("text-center font-medium text-sm", {
                      "text-primary": isCurrent,
                      "text-foreground": isCompleted,
                      "text-muted-foreground": isUpcoming,
                    })}
                  >
                    {label}
                  </span>
                </div>

                {/* コネクター（最後のステップ以外） */}
                {index < steps.length - 1 ? (
                  <div className="mx-2 h-[2px] flex-1">
                    <div
                      className={cn(
                        "h-full w-full rounded-full transition-all",
                        {
                          "bg-primary": index < currentStep,
                          "bg-muted-foreground/30": index >= currentStep,
                        }
                      )}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* モバイル版：コンパクト */}
      <div className="sm:hidden">
        <div className="flex items-center gap-2">
          {steps.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div
                className={cn("flex items-center gap-2", {
                  "flex-1": isCurrent,
                })}
                key={label}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold text-xs transition-all",
                    {
                      "h-10 w-10 border-primary bg-primary font-semibold text-primary-foreground text-sm":
                        isCurrent,
                      "border-primary bg-primary text-primary-foreground":
                        isCompleted,
                      "border-muted-foreground/30 bg-muted text-muted-foreground":
                        isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {isCurrent ? (
                  <span className="truncate font-medium text-primary text-sm">
                    {label}
                  </span>
                ) : null}

                {/* コネクター（最後のステップ以外） */}
                {index < steps.length - 1 && !isCurrent ? (
                  <div
                    className={cn("h-[2px] w-4 rounded-full", {
                      "bg-primary": isCompleted,
                      "bg-muted-foreground/30": isUpcoming,
                    })}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 現在のステップの説明 */}
        <div className="mt-3 text-muted-foreground text-xs">
          ステップ {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
}
