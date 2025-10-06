"use client";

import { useId, useMemo } from "react";
import type { FloorMapPin } from "@/components/app/map/floor-map";
import { FloorMap } from "@/components/app/map/floor-map";
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
import { PERCENT_DECIMALS, STEP_LABELS } from "../constants";
import type { DraftItem, DraftItemErrorMap, PinEditMode } from "../types";
import { formatPoint } from "../utils";

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

const STEP_CAPTIONS: Record<PinEditMode, string> = {
  source: "借用元の位置を選択してください",
  target: "移動先の位置を選択してください",
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-sm">{STEP_LABELS.at(2)}</p>
          <p className="text-muted-foreground text-xs">
            物品ごとにエリアと階層、借用元・移動先の位置を指定します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs" htmlFor="pin-item-select">
            編集対象
          </Label>
          <Select
            onValueChange={(value) => onSelectItem(value)}
            value={selectedItemId ?? ""}
          >
            <SelectTrigger className="w-48" id="pin-item-select">
              <SelectValue placeholder="物品を選択" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name || "名称未設定の物品"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {selectedItem.name || "名称未設定の物品"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="pin-area-select">エリア</Label>
              <Select
                onValueChange={(value) =>
                  onSelectArea(selectedItem.id, value || null)
                }
                value={selectedItem.pin?.areaId ?? ""}
              >
                <SelectTrigger id="pin-area-select">
                  <SelectValue placeholder="エリアを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">指定なし</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pin-floor-select">階層</Label>
              <Select
                disabled={!selectedArea}
                onValueChange={(value) =>
                  onSelectFloor(selectedItem.id, value || null)
                }
                value={selectedItem.pin?.floorId ?? ""}
              >
                <SelectTrigger id="pin-floor-select">
                  <SelectValue placeholder="階層を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">指定なし</SelectItem>
                  {availableFloors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      {floor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pin-mode-toggle">指定中の位置</Label>
              <ToggleGroup
                id="pin-mode-toggle"
                onValueChange={(value) =>
                  onEditModeChange((value as PinEditMode) || editMode)
                }
                type="single"
                value={editMode}
              >
                <ToggleGroupItem aria-label="借用元の位置" value="source">
                  借用元
                </ToggleGroupItem>
                <ToggleGroupItem aria-label="移動先の位置" value="target">
                  移動先
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{STEP_CAPTIONS[editMode]}</p>
            <p className="text-muted-foreground text-xs">
              図面をクリックすると、現在選択中の位置として座標が保存されます。
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">借用元</p>
                <p className="text-sm">
                  {selectedItem.pin?.source
                    ? formatPoint(selectedItem.pin.source, PERCENT_DECIMALS)
                    : "未設定"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">移動先</p>
                <p className="text-sm">
                  {selectedItem.pin?.target
                    ? formatPoint(selectedItem.pin.target, PERCENT_DECIMALS)
                    : "未設定"}
                </p>
              </div>
            </div>
            {selectedErrors?.pin ? (
              <p className="mt-2 text-destructive text-sm" role="alert">
                {selectedErrors.pin}
              </p>
            ) : null}
          </div>
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
