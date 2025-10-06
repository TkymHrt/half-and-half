"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { AppHeader } from "@/components/app/header";
import { FloorMap, type FloorMapPin } from "@/components/app/map/floor-map";
import { MapControls } from "@/components/app/map/map-controls";
import { MapItemList } from "@/components/app/map/map-item-list";
import { PinLegend } from "@/components/app/map/pin-legend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureSeed } from "@/lib/mock";
import { AreaRepository } from "@/lib/mock/repositories/areas";
import { ItemRepository } from "@/lib/mock/repositories/items";
import { cn } from "@/lib/utils";
import type {
  Area,
  EntityId,
  Floor,
  Item,
  ItemStatus,
  RelativePoint,
} from "@/types/app";

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

const LOCATION_MATCH_EPSILON = 0.0015;

type ViewMode = "source" | "target" | "both";
type StatusFilter = ItemStatus | "all";

type MapItem = Item & { areaId: EntityId | null; floorId: EntityId | null };

type PinKind = "source" | "target";

function createMapLabel(area: Area | null, floor: Floor | null): string {
  if (area && floor) {
    return `${area.name} ${floor.name} の図面`;
  }

  if (area) {
    return `${area.name} の図面`;
  }

  return "構内図面";
}

export default function MapPage() {
  const searchParams = useSearchParams();
  const searchSignature = searchParams.toString();
  const [areas, setAreas] = useState<Area[]>([]);
  const [items, setItems] = useState<MapItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<EntityId | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<EntityId | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<EntityId | null>(null);
  const [selectedPinKind, setSelectedPinKind] = useState<PinKind | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("target");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      await ensureSeed();
      const [areaList, itemList] = await Promise.all([
        AreaRepository.list(),
        ItemRepository.list(),
      ]);

      if (!active) {
        return;
      }

      const normalizedItems: MapItem[] = itemList.map((item) => ({
        ...item,
        areaId: item.pin?.areaId ?? null,
        floorId: item.pin?.floorId ?? null,
      }));

      setAreas(areaList);
      setItems(normalizedItems);
      const firstArea = areaList.at(0) ?? null;
      const firstFloor = firstArea?.floors.at(0) ?? null;
      setSelectedAreaId(firstArea?.id ?? null);
      setSelectedFloorId(firstFloor?.id ?? null);
      setIsLoading(false);
    }

    bootstrap().catch(() => {
      if (active) {
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAreaId) {
      return;
    }
    const area = areas.find((candidate) => candidate.id === selectedAreaId);
    if (!area) {
      return;
    }
    const hasFloor = area.floors.some((floor) => floor.id === selectedFloorId);
    if (!hasFloor) {
      const nextFloor = area.floors.at(0) ?? null;
      setSelectedFloorId(nextFloor?.id ?? null);
    }
  }, [areas, selectedAreaId, selectedFloorId]);

  const areaMap = useMemo(() => {
    const map = new Map<EntityId, Area>();
    for (const area of areas) {
      map.set(area.id, area);
    }
    return map;
  }, [areas]);

  const selectedArea = useMemo(
    () => areas.find((area) => area.id === selectedAreaId) ?? null,
    [areas, selectedAreaId]
  );

  const selectedFloor = useMemo(
    () =>
      selectedArea?.floors.find((floor) => floor.id === selectedFloorId) ??
      null,
    [selectedArea, selectedFloorId]
  );

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.pin !== undefined &&
          item.pin !== null &&
          (statusFilter === "all" || item.status === statusFilter) &&
          (!selectedAreaId || item.areaId === selectedAreaId) &&
          (!selectedFloorId || item.floorId === selectedFloorId)
      ),
    [items, selectedAreaId, selectedFloorId, statusFilter]
  );

  const selectedItem = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return filteredItems.find((item) => item.id === selectedItemId) ?? null;
  }, [filteredItems, selectedItemId]);

  useEffect(() => {
    if (
      selectedItemId &&
      !filteredItems.some((item) => item.id === selectedItemId)
    ) {
      setSelectedItemId(null);
      setSelectedPinKind(null);
      setIsDrawerOpen(false);
    }
  }, [filteredItems, selectedItemId]);

  useEffect(() => {
    if (!selectedItemId) {
      return;
    }
    const node = document.getElementById(`map-item-${selectedItemId}`);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedItemId]);

  const ensureViewModeSupports = useCallback((kind: PinKind | null) => {
    if (!kind) {
      return;
    }
    setViewMode((previous) => {
      if (previous === "both" || previous === kind) {
        return previous;
      }
      return "both";
    });
  }, []);

  const getPreferredPinKindForItem = useCallback(
    (item: MapItem, fallback: PinKind | null = null): PinKind | null => {
      const pin = item.pin;
      if (!pin) {
        return null;
      }

      const availability = {
        source: Boolean(pin.source),
        target: Boolean(pin.target),
      } as const;

      return choosePinKind(viewMode, availability, fallback);
    },
    [viewMode]
  );

  const handleSelectItem = useCallback(
    (item: MapItem, requestedKind: PinKind | null = null) => {
      const nextKind = getPreferredPinKindForItem(item, requestedKind);
      setSelectedItemId(item.id);
      setSelectedPinKind(nextKind);
      ensureViewModeSupports(nextKind);
      setIsDrawerOpen(true);
    },
    [ensureViewModeSupports, getPreferredPinKindForItem]
  );

  const handlePinSelect = useCallback(
    (pin: FloorMapPin) => {
      const item = filteredItems.find(
        (candidate) => candidate.id === pin.itemId
      );
      if (!item) {
        return;
      }
      handleSelectItem(item, pin.kind as PinKind);
    },
    [filteredItems, handleSelectItem]
  );

  const derivedSearchState = useMemo(
    () => deriveMapStateFromSearch(searchSignature, areas, areaMap, items),
    [areaMap, areas, items, searchSignature]
  );

  useEffect(() => {
    if (areas.length === 0 || items.length === 0) {
      return;
    }

    if (!derivedSearchState.hasQuery) {
      setIsDrawerOpen(false);
      return;
    }

    setSelectedAreaId(derivedSearchState.areaId);
    setSelectedFloorId(derivedSearchState.floorId);

    if (derivedSearchState.viewMode) {
      setViewMode(derivedSearchState.viewMode);
    } else {
      ensureViewModeSupports(derivedSearchState.pinKind);
    }

    if (derivedSearchState.item) {
      handleSelectItem(derivedSearchState.item, derivedSearchState.pinKind);
    }
  }, [
    areas.length,
    derivedSearchState,
    ensureViewModeSupports,
    handleSelectItem,
    items.length,
  ]);

  const pinKinds = useMemo(() => getKindsForViewMode(viewMode), [viewMode]);

  const pins = useMemo<FloorMapPin[]>(() => {
    if (!selectedAreaId) {
      return [];
    }

    if (!selectedFloorId) {
      return [];
    }

    return generatePins(
      filteredItems,
      pinKinds,
      selectedItemId,
      selectedPinKind
    );
  }, [
    filteredItems,
    pinKinds,
    selectedAreaId,
    selectedFloorId,
    selectedItemId,
    selectedPinKind,
  ]);

  const focusedPinId = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    if (!selectedPinKind) {
      return null;
    }
    return `${selectedItemId}-${selectedPinKind}`;
  }, [selectedItemId, selectedPinKind]);

  const mapInstructionsId = useId();
  const mapLabelText = createMapLabel(selectedArea, selectedFloor);

  const drawerItems = useMemo<MapItem[]>(
    () => collectDrawerItems(filteredItems, selectedItem, selectedPinKind),
    [filteredItems, selectedItem, selectedPinKind]
  );

  const drawerLocation = useMemo(() => {
    const pin = selectedItem?.pin;
    if (!pin) {
      return null;
    }

    const area = resolveArea(areaMap, areas, pin.areaId);
    const floor = resolveFloor(area, pin.floorId);

    let label: string | null = null;
    let kindLabel: string | null = null;

    if (selectedPinKind === "source") {
      label = selectedItem?.sourceName ?? null;
      kindLabel = "借用元";
    } else if (selectedPinKind === "target") {
      label = selectedItem?.targetName ?? null;
      kindLabel = "移動先";
    }

    return {
      areaName: area?.name ?? null,
      floorName: floor?.name ?? null,
      label,
      kindLabel,
    };
  }, [areaMap, areas, selectedItem, selectedPinKind]);

  const drawerOpen = isDrawerOpen && selectedItem !== null;

  const drawerDescription = useMemo(() => {
    if (!selectedItem) {
      return "選択した物品の詳細を確認できます。";
    }

    const location = drawerLocation;
    const label = location?.label;
    const kindLabel = location?.kindLabel;

    if (!label) {
      return "選択した物品の詳細を確認できます。";
    }

    if (!kindLabel) {
      return "選択した物品の詳細を確認できます。";
    }

    const areaFloor = [location.areaName, location.floorName]
      .filter(Boolean)
      .join(" / ");

    if (areaFloor) {
      return `${kindLabel}: ${label}（${areaFloor}）`;
    }

    return `${kindLabel}: ${label}`;
  }, [drawerLocation, selectedItem]);

  const statusFilterLabel =
    statusFilter === "all" ? "すべて" : STATUS_LABEL[statusFilter];

  return (
    <>
      <AppHeader description="構内図と物品の配置状況を確認" title="マップ" />

      <div className="relative flex-1">
        <p className="sr-only" id={mapInstructionsId}>
          図面はドラッグで移動し、ピンはタブキーで順番に移動できます。フォーカス中にエンターキーかスペースキーを押すと物品の詳細が開きます。
        </p>

        <div className="absolute inset-0">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-3xl" />
          ) : (
            <FloorMap
              className="h-full min-h-[24rem] w-full"
              descriptionId={mapInstructionsId}
              floor={
                selectedFloor
                  ? {
                      id: selectedFloor.id,
                      imageUrl: selectedFloor.imageUrl,
                      width: selectedFloor.width,
                      height: selectedFloor.height,
                    }
                  : null
              }
              focusedPinId={focusedPinId}
              mapLabel={mapLabelText}
              onPinSelect={handlePinSelect}
              pins={pins}
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute top-2 right-2 left-2 flex flex-col gap-2 sm:top-4 sm:right-auto sm:left-4 sm:max-w-xl">
            <MapControls
              areas={areas}
              onAreaChange={setSelectedAreaId}
              onFloorChange={setSelectedFloorId}
              onStatusFilterChange={setStatusFilter}
              onViewModeChange={setViewMode}
              selectedArea={selectedArea}
              selectedAreaId={selectedAreaId}
              selectedFloor={selectedFloor}
              selectedFloorId={selectedFloorId}
              statusFilter={statusFilter}
              viewMode={viewMode}
            />

            <MapItemList
              isLoading={isLoading}
              items={filteredItems.map((item) => ({
                id: item.id,
                name: item.name,
                sourceName: item.sourceName,
                targetName: item.targetName,
                status: item.status,
              }))}
              onSelectItem={(simpleItem) => {
                const fullItem = filteredItems.find(
                  (i) => i.id === simpleItem.id
                );
                if (fullItem) {
                  handleSelectItem(fullItem);
                }
              }}
              selectedItemId={selectedItemId}
              statusFilterLabel={statusFilterLabel}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] z-30 flex justify-center px-4">
        <div className="pointer-events-auto rounded-2xl border border-border/60 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
          <PinLegend />
        </div>
      </div>

      <Drawer onOpenChange={setIsDrawerOpen} open={drawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedItem?.name ?? "物品詳細"}</DrawerTitle>
            <DrawerDescription>{drawerDescription}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="max-h-[calc(80vh-10rem)] px-4">
            {drawerItems.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
                詳細を表示できる物品がありません。
              </p>
            ) : (
              <ul className="space-y-4">
                {drawerItems.map((item) => {
                  const isPrimary = item.id === selectedItem?.id;
                  const taskHref = `/protected/tasks/${encodeURIComponent(item.taskId)}`;
                  return (
                    <li
                      className={cn(
                        "rounded-lg border bg-background px-4 py-3 shadow-sm",
                        isPrimary ? "border-primary/60" : "border-border"
                      )}
                      key={item.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {item.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            数量 {item.quantity}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs",
                            STATUS_BADGE_CLASS[item.status]
                          )}
                          variant="outline"
                        >
                          {STATUS_LABEL[item.status]}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <dl className="grid gap-2 text-muted-foreground text-xs">
                          <div>
                            <dt className="font-medium text-[11px] text-foreground/70">
                              借用元
                            </dt>
                            <dd
                              className={cn(
                                "mt-0.5 text-foreground text-sm",
                                selectedPinKind === "source" && isPrimary
                                  ? "font-semibold"
                                  : "font-normal text-foreground/90"
                              )}
                            >
                              {item.sourceName}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-[11px] text-foreground/70">
                              移動先
                            </dt>
                            <dd
                              className={cn(
                                "mt-0.5 text-foreground text-sm",
                                selectedPinKind === "target" && isPrimary
                                  ? "font-semibold"
                                  : "font-normal text-foreground/90"
                              )}
                            >
                              {item.targetName}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-[11px] text-foreground/70">
                              担当者
                            </dt>
                            <dd className="mt-0.5 text-foreground text-sm">
                              {item.handler ?? "未設定"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div className="mt-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={taskHref}>タスク詳細へ</Link>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button size="sm" type="button" variant="outline">
                閉じる
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function isSamePoint(a: RelativePoint, b: RelativePoint): boolean {
  return (
    Math.abs(a.x - b.x) <= LOCATION_MATCH_EPSILON &&
    Math.abs(a.y - b.y) <= LOCATION_MATCH_EPSILON
  );
}

type PinAvailability = {
  source: boolean;
  target: boolean;
};

type SearchDerivedState = {
  hasQuery: boolean;
  areaId: EntityId | null;
  floorId: EntityId | null;
  pinKind: PinKind | null;
  viewMode: ViewMode | null;
  item: MapItem | null;
};

type ItemResolutionInput = {
  areaId: EntityId | null;
  floorId: EntityId | null;
  pinKind: PinKind | null;
  viewMode: ViewMode | null;
};

function choosePinKind(
  viewMode: ViewMode,
  availability: PinAvailability,
  fallback: PinKind | null
): PinKind | null {
  if (viewMode === "source" && availability.source) {
    return "source";
  }

  if (viewMode === "target" && availability.target) {
    return "target";
  }

  if (viewMode === "both") {
    if (availability.target) {
      return "target";
    }
    if (availability.source) {
      return "source";
    }
  }

  if (fallback && availability[fallback]) {
    return fallback;
  }

  if (availability.target) {
    return "target";
  }

  if (availability.source) {
    return "source";
  }

  return null;
}

function deriveMapStateFromSearch(
  signature: string,
  areas: Area[],
  areaMap: Map<EntityId, Area>,
  items: MapItem[]
): SearchDerivedState {
  if (signature.length === 0) {
    return {
      hasQuery: false,
      areaId: null,
      floorId: null,
      pinKind: null,
      viewMode: null,
      item: null,
    };
  }

  const params = new URLSearchParams(signature);
  const itemId = params.get("item");
  const item =
    itemId === null
      ? null
      : (items.find((candidate) => candidate.id === itemId) ?? null);

  const initial: ItemResolutionInput = {
    areaId: params.get("area"),
    floorId: params.get("floor"),
    pinKind: toPinKind(params.get("pin")),
    viewMode: toViewMode(params.get("view")),
  };

  const adjusted = resolveWithItem(item, initial);
  const area = resolveArea(areaMap, areas, adjusted.areaId);
  const floor = resolveFloor(area, adjusted.floorId);

  return {
    hasQuery: true,
    areaId: area?.id ?? null,
    floorId: floor?.id ?? null,
    pinKind: adjusted.pinKind,
    viewMode: adjusted.viewMode,
    item,
  };
}

function resolveWithItem(
  item: MapItem | null,
  input: ItemResolutionInput
): ItemResolutionInput {
  const pin = item?.pin;
  if (!pin) {
    return input;
  }

  const nextPinKind = pickPinKind(pin, input.pinKind);
  const nextViewMode = resolveViewMode(pin, nextPinKind, input.viewMode);

  return {
    areaId: pin.areaId,
    floorId: pin.floorId,
    pinKind: nextPinKind,
    viewMode: nextViewMode,
  };
}

function resolveViewMode(
  pin: NonNullable<MapItem["pin"]>,
  pinKind: PinKind | null,
  current: ViewMode | null
): ViewMode | null {
  if (current) {
    return current;
  }

  if (pin.source && pin.target) {
    return "both";
  }

  return pinKind;
}

function pickPinKind(
  pin: NonNullable<MapItem["pin"]>,
  preferred: PinKind | null
): PinKind | null {
  if (preferred && hasPinCoordinate(pin, preferred)) {
    return preferred;
  }

  if (pin.target) {
    return "target";
  }

  if (pin.source) {
    return "source";
  }

  return null;
}

function resolveArea(
  areaMap: Map<EntityId, Area>,
  areas: Area[],
  areaId: EntityId | null
): Area | null {
  if (areaId) {
    const matched = areaMap.get(areaId);
    if (matched) {
      return matched;
    }
  }

  return areas.at(0) ?? null;
}

function resolveFloor(area: Area | null, floorId: EntityId | null) {
  if (!area) {
    return null;
  }

  if (floorId) {
    const matched = area.floors.find((candidate) => candidate.id === floorId);
    if (matched) {
      return matched;
    }
  }

  return area.floors.at(0) ?? null;
}

function hasPinCoordinate(
  pin: NonNullable<MapItem["pin"]>,
  kind: PinKind
): boolean {
  if (kind === "source") {
    return Boolean(pin.source);
  }

  return Boolean(pin.target);
}

function toPinKind(value: string | null): PinKind | null {
  if (value === "source" || value === "target") {
    return value;
  }
  return null;
}

function toViewMode(value: string | null): ViewMode | null {
  if (value === "source" || value === "target" || value === "both") {
    return value;
  }
  return null;
}

function getKindsForViewMode(viewMode: ViewMode): PinKind[] {
  if (viewMode === "both") {
    return ["source", "target"];
  }

  if (viewMode === "source") {
    return ["source"];
  }

  return ["target"];
}

function generatePins(
  items: MapItem[],
  kinds: PinKind[],
  selectedItemId: EntityId | null,
  selectedPinKind: PinKind | null
): FloorMapPin[] {
  const result: FloorMapPin[] = [];

  for (const item of items) {
    const pin = item.pin;
    if (!pin) {
      continue;
    }

    const isActive = selectedItemId === item.id;

    for (const kind of kinds) {
      const point = pin[kind];
      if (!point) {
        continue;
      }

      result.push({
        id: `${item.id}-${kind}`,
        itemId: item.id,
        label: item.name,
        x: point.x,
        y: point.y,
        kind,
        status: item.status,
        isFocused: isActive && (!selectedPinKind || selectedPinKind === kind),
      });
    }
  }

  return result;
}

function collectDrawerItems(
  items: MapItem[],
  selectedItem: MapItem | null,
  selectedPinKind: PinKind | null
): MapItem[] {
  if (!selectedItem) {
    return [];
  }

  if (!selectedPinKind) {
    return [selectedItem];
  }

  const pin = selectedItem.pin;
  if (!pin) {
    return [selectedItem];
  }

  const point = pin[selectedPinKind];
  if (!point) {
    return [selectedItem];
  }

  const matches: MapItem[] = [];
  for (const candidate of items) {
    const candidatePin = candidate.pin;
    if (!candidatePin) {
      continue;
    }

    if (
      candidatePin.areaId !== pin.areaId ||
      candidatePin.floorId !== pin.floorId
    ) {
      continue;
    }

    const candidatePoint = candidatePin[selectedPinKind];
    if (!candidatePoint) {
      continue;
    }

    if (isSamePoint(candidatePoint, point)) {
      matches.push(candidate);
    }
  }

  if (!matches.some((candidate) => candidate.id === selectedItem.id)) {
    matches.unshift(selectedItem);
  }

  return matches;
}
