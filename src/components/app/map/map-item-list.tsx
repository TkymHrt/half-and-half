"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { EntityId, ItemStatus } from "@/types/app";

type SimpleMapItem = {
  id: EntityId;
  name: string;
  sourceName: string;
  targetName: string;
  status: ItemStatus;
};

type MapItemListProps = {
  items: SimpleMapItem[];
  selectedItemId: EntityId | null;
  statusFilterLabel: string;
  isLoading: boolean;
  onSelectItem: (item: SimpleMapItem) => void;
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  issue: "問題あり",
  moving: "移動中",
  placed: "配置済み",
  unplaced: "未配置",
};

const STATUS_BADGE_CLASS: Record<ItemStatus, string> = {
  issue: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  moving: "bg-amber-400/20 text-amber-700 border-amber-500/40",
  placed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  unplaced: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

function renderListContent(
  isLoading: boolean,
  items: SimpleMapItem[],
  selectedItemId: EntityId | null,
  onSelectItem: (item: SimpleMapItem) => void
) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
        条件に一致する物品がありません。
      </p>
    );
  }

  return (
    <ScrollArea
      className={cn(
        "pr-2 sm:pr-3",
        "[&_[data-slot=scroll-area-viewport]]:max-h-[32vh]",
        "[&_[data-slot=scroll-area-viewport]]:sm:max-h-[52vh]"
      )}
    >
      <ul className="space-y-2 sm:space-y-3">
        {items.map((item) => {
          const isActive = item.id === selectedItemId;
          return (
            <li id={`map-item-${item.id}`} key={item.id}>
              <button
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 sm:py-3",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/60 hover:bg-primary/5"
                )}
                onClick={() => onSelectItem(item)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground text-sm">
                    {item.name}
                  </span>
                  <Badge
                    className={cn("text-xs", STATUS_BADGE_CLASS[item.status])}
                    variant="outline"
                  >
                    {STATUS_LABEL[item.status]}
                  </Badge>
                </div>
                <p className="mt-1.5 text-muted-foreground/90 text-xs leading-relaxed sm:mt-2">
                  <span className="font-medium text-foreground/80">
                    借用元:
                  </span>{" "}
                  {item.sourceName}
                  <br />
                  <span className="font-medium text-foreground/80">
                    移動先:
                  </span>{" "}
                  {item.targetName}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}

export function MapItemList({
  items,
  selectedItemId,
  statusFilterLabel,
  isLoading,
  onSelectItem,
}: MapItemListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const itemCount = items.length;

  return (
    <div className="rounded-xl border border-border/60 bg-background/95 shadow-xl backdrop-blur sm:rounded-2xl">
      <button
        aria-controls="map-item-list"
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-2 p-3 text-left sm:p-4"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm sm:text-base">
            表示中の物品
          </span>
          <Badge className="shrink-0 text-xs" variant="outline">
            {statusFilterLabel}
          </Badge>
          {itemCount > 0 ? (
            <span className="shrink-0 font-normal text-muted-foreground text-xs">
              {itemCount}件
            </span>
          ) : null}
        </div>
        {isExpanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all ${
          isExpanded ? "max-h-[40vh] sm:max-h-[60vh]" : "max-h-0"
        }`}
        id="map-item-list"
      >
        <div className="border-t p-3 sm:p-4">
          {renderListContent(isLoading, items, selectedItemId, onSelectItem)}
        </div>
      </div>
    </div>
  );
}
