import type { Item, ItemStatus } from "@/types/app";

export const ITEM_STATUS_BADGE_CLASS: Record<ItemStatus, string> = {
  issue: "bg-orange-500/15 border-orange-500/30 text-orange-700",
  moving: "bg-amber-400/20 border-amber-400/40 text-amber-700",
  placed: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700",
  unplaced: "bg-rose-500/15 border-rose-500/40 text-rose-700",
} satisfies Record<ItemStatus, string>;

export const ITEM_STATUS_ADVANCE: Record<
  ItemStatus,
  { next: ItemStatus | null; label: string }
> = {
  issue: { next: null, label: "問題対応中" },
  moving: { next: "placed", label: "配置済みにする" },
  placed: { next: null, label: "完了済み" },
  unplaced: { next: "moving", label: "移動中にする" },
} satisfies Record<ItemStatus, { next: ItemStatus | null; label: string }>;

export function createMapHref(
  item: Item,
  kind: "source" | "target"
): string | null {
  const pin = item.pin;
  if (!pin) {
    return null;
  }

  const point = pin[kind];
  if (!point) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("area", pin.areaId);
  params.set("floor", pin.floorId);
  params.set("item", item.id);
  params.set("pin", kind);
  params.set("view", kind === "source" ? "source" : "target");

  return `/protected/map?${params.toString()}`;
}
