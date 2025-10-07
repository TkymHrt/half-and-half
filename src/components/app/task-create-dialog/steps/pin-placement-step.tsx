"use client";

import { useId, useMemo } from "react";
import type { FloorMapPin } from "@/components/app/map/floor-map";
import { FloorMap } from "@/components/app/map/floor-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Area, Floor, RelativePoint } from "@/types/app";
import { STEP_LABELS } from "../constants";
import type { DraftItem, DraftItemErrorMap, PinEditMode } from "../types";

export type PinPlacementStepProps = {
  items: DraftItem[];
  errors: DraftItemErrorMap;
  selectedItem: DraftItem | undefined;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onSelectArea: (itemId: string, areaId: string | null) => void;
  onSelectFloor: (itemId: string, floorId: string | null) => void;
  onPlacePin: (itemId: string, mode: PinEditMode, point: RelativePoint) => void;
  editMode: PinEditMode;
  onEditModeChange: (mode: PinEditMode) => void;
  areas: Area[];
  isLoadingAreas: boolean;
};

function buildPins(
  items: DraftItem[],
  areaId: string | undefined,
  floorId: string | undefined,
  selectedItemId: string | null
): FloorMapPin[] {
  if (!areaId) {
    return [];
  }

  if (!floorId) {
    return [];
  }

  const pins: FloorMapPin[] = [];
  for (const item of items) {
    if (item.pin?.areaId !== areaId || item.pin.floorId !== floorId) {
      continue;
    }

    const label = item.name || "未命名の物品";
    if (item.pin.source) {
      pins.push({
        id: `${item.id}-source`,
        itemId: item.id,
        label,
        x: item.pin.source.x,
        y: item.pin.source.y,
        kind: "source",
        status: item.status,
        isFocused: item.id === selectedItemId,
      });
    }

    if (item.pin.target) {
      pins.push({
        id: `${item.id}-target`,
        itemId: item.id,
        label,
        x: item.pin.target.x,
        y: item.pin.target.y,
        kind: "target",
        status: item.status,
        isFocused: item.id === selectedItemId,
      });
    }
  }
  return pins;
}

function buildMapLabel(area: Area | null, floor: Floor | null): string {
  if (area && floor) {
    return `${area.name} ${floor.name} の図面`;
  }

  if (area) {
    return `${area.name} の図面`;
  }

  return "構内図面";
}

const MAP_INSTRUCTION_TEXT =
  "図面をクリックまたはタップすると選択中の位置が保存されます。ピンはタブキーで移動でき、フォーカス中にエンターキーかスペースキーで選択できます。";

type MapSectionProps = {
  area: Area | null;
  floor: Floor | null;
  instructionsId: string;
  label: string;
  pins: FloorMapPin[];
  onPlace: (point: RelativePoint) => void;
};

function PinPlacementMapSection({
  area,
  floor,
  instructionsId,
  label,
  pins,
  onPlace,
}: MapSectionProps) {
  if (!area) {
    return (
      <div className="grid h-[28rem] place-items-center rounded-lg border border-dashed text-muted-foreground">
        エリアと階層を選択すると図面が表示されます
      </div>
    );
  }

  if (!floor) {
    return (
      <div className="grid h-[28rem] place-items-center rounded-lg border border-dashed text-muted-foreground">
        エリアと階層を選択すると図面が表示されます
      </div>
    );
  }

  return (
    <>
      <p className="sr-only" id={instructionsId}>
        {MAP_INSTRUCTION_TEXT}
      </p>
      <FloorMap
        descriptionId={instructionsId}
        floor={floor}
        mapLabel={label}
        onPlace={onPlace}
        pins={pins}
      />
    </>
  );
}

export function PinPlacementStep({
  items,
  errors,
  selectedItem,
  selectedItemId,
  onSelectItem,
  onSelectArea,
  onSelectFloor,
  onPlacePin,
  editMode,
  onEditModeChange,
  areas,
  isLoadingAreas,
}: PinPlacementStepProps) {
  const selectedArea = useMemo(() => {
    if (!selectedItem?.pin?.areaId) {
      return null;
    }

    return areas.find((area) => area.id === selectedItem.pin?.areaId) ?? null;
  }, [areas, selectedItem?.pin?.areaId]);

  const availableFloors = selectedArea?.floors ?? [];
  const selectedFloor = useMemo(() => {
    if (!selectedItem?.pin?.floorId) {
      return null;
    }

    return (
      availableFloors.find((floor) => floor.id === selectedItem.pin?.floorId) ??
      null
    );
  }, [availableFloors, selectedItem?.pin?.floorId]);

  const mapPins = useMemo(
    () =>
      buildPins(
        items,
        selectedItem?.pin?.areaId,
        selectedItem?.pin?.floorId,
        selectedItemId
      ),
    [
      items,
      selectedItem?.pin?.areaId,
      selectedItem?.pin?.floorId,
      selectedItemId,
    ]
  );

  const selectedErrors = selectedItemId ? errors[selectedItemId] : undefined;
  const mapInstructionsId = useId();

  const currentIndex = items.findIndex((item) => item.id === selectedItemId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handlePrevious = () => {
    if (!hasPrevious) {
      return;
    }
    const previousItem = items[currentIndex - 1];
    if (previousItem) {
      onSelectItem(previousItem.id);
    }
  };

  const handleNext = () => {
    if (!hasNext) {
      return;
    }
    const nextItem = items[currentIndex + 1];
    if (nextItem) {
      onSelectItem(nextItem.id);
    }
  };

  if (isLoadingAreas) {
    return (
      <div className="grid h-[28rem] place-items-center rounded-lg border border-dashed text-muted-foreground">
        図面データを読み込み中です...
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className="grid h-[28rem] place-items-center rounded-lg border border-dashed text-muted-foreground">
        物品を追加し、選択してください
      </div>
    );
  }

  const mapLabel = buildMapLabel(selectedArea, selectedFloor);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div>
          <p className="font-medium text-sm sm:text-base">
            {STEP_LABELS.at(2)}
          </p>
          <p className="text-muted-foreground text-xs">
            {currentIndex + 1} / {items.length}件目を編集中
          </p>
        </div>

        <div className="flex gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="pin-item-select">編集する物品</Label>
            <Select
              onValueChange={(value) => onSelectItem(value)}
              value={selectedItemId ?? ""}
            >
              <SelectTrigger className="min-h-[44px]" id="pin-item-select">
                <SelectValue placeholder="物品を選択" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item, index) => (
                  <SelectItem key={item.id} value={item.id}>
                    {index + 1}. {item.name || "名称未設定"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex shrink-0 items-end gap-1">
            <Button
              aria-label="前の物品"
              className="h-[44px] w-[44px]"
              disabled={!hasPrevious}
              onClick={handlePrevious}
              size="icon"
              type="button"
              variant="outline"
            >
              ←
            </Button>
            <Button
              aria-label="次の物品"
              className="h-[44px] w-[44px]"
              disabled={!hasNext}
              onClick={handleNext}
              size="icon"
              type="button"
              variant="outline"
            >
              →
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {selectedItem.name || "名称未設定の物品"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pin-area-select">エリア</Label>
            <Select
              onValueChange={(value) =>
                onSelectArea(selectedItem.id, value === "none" ? null : value)
              }
              value={selectedItem.pin?.areaId ?? "none"}
            >
              <SelectTrigger className="min-h-[44px]" id="pin-area-select">
                <SelectValue placeholder="エリアを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">指定なし</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin-floor-select">階層</Label>
            <Select
              disabled={!selectedArea}
              onValueChange={(value) =>
                onSelectFloor(selectedItem.id, value === "none" ? null : value)
              }
              value={selectedItem.pin?.floorId ?? "none"}
            >
              <SelectTrigger className="min-h-[44px]" id="pin-floor-select">
                <SelectValue placeholder="階層を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">指定なし</SelectItem>
                {availableFloors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin-mode-toggle">位置の種類</Label>
            <ToggleGroup
              className="grid w-full grid-cols-2 gap-2"
              id="pin-mode-toggle"
              onValueChange={(value) =>
                onEditModeChange((value as PinEditMode) || editMode)
              }
              type="single"
              value={editMode}
            >
              <ToggleGroupItem
                aria-label="借用元の位置"
                className="min-h-[44px]"
                value="source"
              >
                借用元
              </ToggleGroupItem>
              <ToggleGroupItem
                aria-label="移動先の位置"
                className="min-h-[44px]"
                value="target"
              >
                移動先
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {selectedErrors?.pin ? (
            <p className="mt-2 text-destructive text-sm" role="alert">
              {selectedErrors.pin}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <PinPlacementMapSection
        area={selectedArea}
        floor={selectedFloor}
        instructionsId={mapInstructionsId}
        label={mapLabel}
        onPlace={(point) => onPlacePin(selectedItem.id, editMode, point)}
        pins={mapPins}
      />
    </div>
  );
}
