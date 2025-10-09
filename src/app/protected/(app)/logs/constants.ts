import type { Issue, ItemStatus, LogEvent } from "@/types/app";

export const LOG_PAGE_SIZE = 12;
export const LOG_ID_RADIX = 36;

export const LOG_TYPE_BADGE_CLASS: ReadonlyMap<LogEvent["type"], string> =
  new Map([
    ["task_created", "bg-blue-500/15 text-blue-700 border-blue-500/30"],
    [
      "task_status_changed",
      "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
    ],
    ["item_added", "bg-sky-500/15 text-sky-700 border-sky-500/30"],
    [
      "item_status_changed",
      "bg-amber-400/20 text-amber-700 border-amber-500/40",
    ],
    ["issue_reported", "bg-orange-500/15 text-orange-700 border-orange-500/30"],
    [
      "item_photo_uploaded",
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    ],
    [
      "issue_status_changed",
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
    ],
  ]);

export const LOG_TYPE_LABEL: ReadonlyMap<LogEvent["type"], string> = new Map([
  ["task_created", "タスク作成"],
  ["task_status_changed", "タスク更新"],
  ["item_added", "物品追加"],
  ["item_status_changed", "ステータス更新"],
  ["issue_reported", "問題報告"],
  ["issue_status_changed", "問題対応"],
  ["item_photo_uploaded", "写真登録"],
]);

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  issue: "問題あり",
  moving: "移動中",
  placed: "配置済み",
  unplaced: "未配置",
};

export const ISSUE_KIND_LABEL: Record<Issue["kind"], string> = {
  damage: "破損",
  loss: "紛失",
  other: "その他",
};

export const ISSUE_KIND_BADGE_CLASS: Record<Issue["kind"], string> = {
  damage: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  loss: "bg-amber-400/20 text-amber-700 border-amber-500/40",
  other: "bg-slate-500/15 text-slate-700 border-slate-500/30",
};

export const ISSUE_STATUS_LABEL: Record<Issue["status"], string> = {
  open: "対応中",
  resolved: "解決済み",
};

export const ISSUE_STATUS_BADGE_CLASS: Record<Issue["status"], string> = {
  open: "bg-destructive/10 text-destructive border-destructive/40",
  resolved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
};

export const DATE_INPUT_SEGMENT_COUNT = 3;

export const START_OF_DAY_BOUNDARY = Object.freeze({
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
});

export const END_OF_DAY_BOUNDARY = Object.freeze({
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
});
