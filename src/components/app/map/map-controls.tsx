"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Area, EntityId, Floor, ItemStatus } from "@/types/app";

type ViewMode = "source" | "target" | "both";

type MapControlsProps = {
  areas: Area[];
  selectedArea: Area | null;
  selectedFloor: Floor | null;
  selectedAreaId: EntityId | null;
  selectedFloorId: EntityId | null;
  viewMode: ViewMode;
  statusFilter: ItemStatus | "all";
  onAreaChange: (value: EntityId | null) => void;
  onFloorChange: (value: EntityId | null) => void;
  onViewModeChange: (value: ViewMode) => void;
  onStatusFilterChange: (value: ItemStatus | "all") => void;
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  issue: "問題あり",
  moving: "移動中",
  placed: "配置済み",
  unplaced: "未配置",
};

export function MapControls({
  areas,
  selectedArea,
  selectedFloor,
  selectedAreaId,
  selectedFloorId,
  viewMode,
  statusFilter,
  onAreaChange,
  onFloorChange,
  onViewModeChange,
  onStatusFilterChange,
}: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur sm:rounded-2xl">
      <button
        aria-controls="map-controls"
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-2 p-3 text-left sm:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="font-medium text-foreground text-sm">
          {selectedArea?.name ?? "エリア未選択"}
          {selectedFloor ? ` / ${selectedFloor.name}` : null}
        </span>
        {isExpanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all sm:block ${
          isExpanded ? "max-h-96" : "max-h-0 sm:max-h-none"
        }`}
        id="map-controls"
      >
        <div className="border-t p-3 sm:border-t-0 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            <Select
              disabled={areas.length === 0}
              onValueChange={(value) => {
                onAreaChange(value || null);
              }}
              value={selectedAreaId ?? ""}
            >
              <SelectTrigger aria-label="エリアの選択" className="w-full">
                <SelectValue placeholder="エリアを選択" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              disabled={!selectedArea || selectedArea.floors.length === 0}
              onValueChange={(value) => {
                onFloorChange(value || null);
              }}
              value={selectedFloorId ?? ""}
            >
              <SelectTrigger aria-label="フロアの選択" className="w-full">
                <SelectValue placeholder="フロアを選択" />
              </SelectTrigger>
              <SelectContent>
                {selectedArea?.floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => {
                onStatusFilterChange((value || "all") as ItemStatus | "all");
              }}
              value={statusFilter}
            >
              <SelectTrigger
                aria-label="ステータスの絞り込み"
                className="w-full"
              >
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                {(Object.keys(STATUS_LABEL) as ItemStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ToggleGroup
            aria-label="表示するピンの種類"
            className="mt-2 flex w-full gap-1.5 rounded-md border border-border/60 bg-background/80 p-1 sm:mt-3 sm:gap-2"
            onValueChange={(value) => {
              if (!value) {
                return;
              }
              onViewModeChange(value as ViewMode);
            }}
            type="single"
            value={viewMode}
          >
            <ToggleGroupItem
              aria-label="移動先のピンを表示"
              className="flex-1 rounded-sm text-xs data-[state=on]:bg-primary/15 data-[state=on]:font-semibold data-[state=on]:text-primary"
              value="target"
            >
              移動先
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label="借用元のピンを表示"
              className="flex-1 rounded-sm text-xs data-[state=on]:bg-primary/15 data-[state=on]:font-semibold data-[state=on]:text-primary"
              value="source"
            >
              借用元
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label="両方のピンを表示"
              className="flex-1 rounded-sm text-xs data-[state=on]:bg-primary/15 data-[state=on]:font-semibold data-[state=on]:text-primary"
              value="both"
            >
              両方
            </ToggleGroupItem>
          </ToggleGroup>

          <p className="mt-2 hidden font-medium text-foreground text-xs sm:mt-3 sm:block sm:text-sm">
            {selectedArea?.name ?? "エリア未選択"}
            {selectedFloor ? ` / ${selectedFloor.name}` : null}
          </p>
        </div>
      </div>
    </div>
  );
}
