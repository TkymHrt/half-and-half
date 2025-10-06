import { Badge } from "@/components/ui/badge";
import type { ItemStatus } from "@/types/app";

const STATUS_META: Record<
  ItemStatus,
  {
    label: string;
    color: string;
  }
> = {
  issue: {
    label: "問題あり",
    color: "bg-orange-500",
  },
  moving: {
    label: "移動中",
    color: "bg-amber-400",
  },
  placed: {
    label: "配置済み",
    color: "bg-emerald-500",
  },
  unplaced: {
    label: "未配置",
    color: "bg-rose-500",
  },
};

export function PinLegend() {
  return (
    <section
      aria-label="マップの凡例"
      className="text-muted-foreground text-sm"
    >
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_META).map(([status, meta]) => (
          <div className="flex items-center gap-1.5" key={status}>
            <span
              aria-hidden="true"
              className={`size-3 rounded-full ${meta.color}`}
            />
            <Badge
              className="border-muted-foreground/40 text-foreground text-xs"
              variant="outline"
            >
              {meta.label}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
