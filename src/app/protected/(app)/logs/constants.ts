export const LOG_ID_RADIX = 36;

// Issue関連の定数
export const ISSUE_KIND_LABEL = {
  loss: "紛失",
  damage: "破損",
  other: "その他",
} as const;

export const ISSUE_KIND_BADGE_CLASS = {
  loss: "bg-red-100 text-red-800",
  damage: "bg-blue-100 text-blue-800", 
  other: "bg-gray-100 text-gray-800",
} as const;

export const ISSUE_STATUS_LABEL = {
  open: "対応中",
  resolved: "解決済み",
} as const;

export const ISSUE_STATUS_BADGE_CLASS = {
  open: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
} as const;

// Log関連の定数
export const LOG_TYPE_LABEL = {
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_created: "タスク作成",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_updated: "タスク更新",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_status_changed: "タスクステータス変更",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_deleted: "タスク削除",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_added: "物品追加",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_updated: "物品更新",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_status_changed: "物品ステータス変更",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_deleted: "物品削除",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  issue_reported: "問題報告",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  issue_status_changed: "問題ステータス変更",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_photo_uploaded: "写真アップロード",
} as const;

export const LOG_TYPE_BADGE_CLASS = new Map([
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["task_created", "bg-blue-100 text-blue-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["task_updated", "bg-blue-100 text-blue-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["task_status_changed", "bg-blue-100 text-blue-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["task_deleted", "bg-red-100 text-red-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["item_added", "bg-green-100 text-green-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["item_updated", "bg-yellow-100 text-yellow-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["item_status_changed", "bg-yellow-100 text-yellow-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["item_deleted", "bg-red-100 text-red-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["issue_reported", "bg-orange-100 text-orange-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["issue_status_changed", "bg-orange-100 text-orange-800"],
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  ["item_photo_uploaded", "bg-purple-100 text-purple-800"],
]);

// Item関連の定数
export const ITEM_STATUS_LABEL = {
  unplaced: "未配置",
  moving: "移動中",
  placed: "配置済み",
  issue: "問題あり",
} as const;
