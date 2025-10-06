import type { ItemStatus, TaskStatus } from "@/types/app";

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "done":
      return "完了";
    case "in_progress":
      return "進行中";
    case "not_started":
      return "未着手";
    default:
      return status;
  }
}

export function getTaskStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "done":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
    case "in_progress":
      return "bg-sky-500/15 text-sky-700 border-sky-500/30";
    case "not_started":
      return "bg-muted border-muted-foreground/30 text-muted-foreground";
    default:
      return "bg-muted border-border text-muted-foreground";
  }
}

export function getItemStatusLabel(status: ItemStatus): string {
  switch (status) {
    case "issue":
      return "問題あり";
    case "moving":
      return "移動中";
    case "placed":
      return "配置済み";
    case "unplaced":
      return "未配置";
    default:
      return status;
  }
}

export const ITEM_STATUS_ORDER: ItemStatus[] = [
  "unplaced",
  "moving",
  "placed",
  "issue",
];

export function createEmptyItemStatusCount(): Record<ItemStatus, number> {
  return {
    issue: 0,
    moving: 0,
    placed: 0,
    unplaced: 0,
  } satisfies Record<ItemStatus, number>;
}
