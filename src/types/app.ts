export type ID = string;

export type TaskStatus = "not_started" | "in_progress" | "done";
export type ItemStatus = "unplaced" | "moving" | "placed" | "issue";

export type Area = {
  id: ID;
  name: string; // 例: "本館"
  floors: Floor[];
};

export type Floor = {
  id: ID;
  name: string; // 例: "1F"
  imageUrl: string; // public/maps/honkan/1f.png
  width: number; // px
  height: number; // px
};

export type RelativeXY = { x: number; y: number }; // 0..1 正規化座標

export type LocationPin = {
  areaId: ID;
  floorId: ID;
  source?: RelativeXY; // 借用元
  target?: RelativeXY; // 移動先
};

export type Item = {
  id: ID;
  taskId: ID;
  name: string;
  quantity: number;
  sourceName: string; // テキスト: "201講義室"
  targetName: string; // テキスト: "体育館ステージ"
  handler?: string; // テキスト: "総務局長・名前" など
  status: ItemStatus;
  pin?: LocationPin;
  photoIds?: ID[]; // 写真（モックではIDB/LS）の参照
};

export type Task = {
  id: ID;
  title: string;
  description?: string;
  handler?: string;
  status: TaskStatus;
  itemIds: ID[];
  createdAt: string;
};

export type LogEvent = {
  id: ID;
  at: string;
  actor: string; // 表示名のみ
  type:
    | "task_created"
    | "item_added"
    | "item_status_changed"
    | "issue_reported"
    | "item_photo_uploaded";
  payload: Record<string, any>;
};

export type Issue = {
  id: ID;
  at: string;
  reporter: string;
  itemId?: ID;
  summary: string;
  detail?: string;
  kind: "loss" | "damage" | "other";
  status: "open" | "resolved";
};