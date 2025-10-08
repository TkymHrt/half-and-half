export const LOG_ID_RADIX = 36;

// Issue関連の定数
export const ISSUE_KIND_LABEL = {
  safety: "安全性",
  equipment: "設備",
  logistics: "物流",
  communication: "連絡",
  other: "その他",
} as const;

export const ISSUE_KIND_BADGE_CLASS = {
  safety: "bg-red-100 text-red-800",
  equipment: "bg-blue-100 text-blue-800",
  logistics: "bg-green-100 text-green-800",
  communication: "bg-yellow-100 text-yellow-800",
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
export const LOG_TYPE_BADGE_CLASS = {
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_created: "bg-blue-100 text-blue-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_updated: "bg-blue-100 text-blue-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_status_changed: "bg-blue-100 text-blue-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  task_deleted: "bg-red-100 text-red-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_added: "bg-green-100 text-green-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_updated: "bg-yellow-100 text-yellow-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_status_changed: "bg-yellow-100 text-yellow-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_deleted: "bg-red-100 text-red-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  issue_reported: "bg-orange-100 text-orange-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  issue_status_changed: "bg-orange-100 text-orange-800",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  item_photo_uploaded: "bg-purple-100 text-purple-800",
} as const;

// Item関連の定数
export const ITEM_STATUS_LABEL = {
  pending: "待機中",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  picked_up: "回収済み",
  // biome-ignore lint/style/useNamingConvention: API型定義に合わせる必要
  in_transit: "搬送中",
  delivered: "配送完了",
} as const;
