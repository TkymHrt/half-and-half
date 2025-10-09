export type EntityId = string;

export type TaskStatus = "not_started" | "in_progress" | "done";
export type ItemStatus = "unplaced" | "moving" | "placed" | "issue";

export type RelativePoint = {
  x: number;
  y: number;
};

export type LocationPin = {
  areaId: EntityId;
  floorId: EntityId;
  source?: RelativePoint;
  target?: RelativePoint;
};

export type Item = {
  id: EntityId;
  taskId: EntityId;
  name: string;
  quantity: number;
  sourceName: string;
  targetName: string;
  handler?: string;
  status: ItemStatus;
  pin?: LocationPin;
  photoIds?: EntityId[];
};

export type ItemPhoto = {
  id: EntityId;
  itemId: EntityId;
  fileName?: string;
  mimeType: string;
  size: number;
  createdAt: string;
  note?: string;
  hasBlob: boolean;
  previewDataUrl?: string;
};

export type Task = {
  id: EntityId;
  title: string;
  description?: string;
  handler?: string;
  status: TaskStatus;
  itemIds: EntityId[];
  createdAt: string;
};

export type LogEvent = {
  id: EntityId;
  at: string;
  actor: string;
  type:
    | "task_created"
    | "task_updated"
    | "task_status_changed"
    | "task_deleted"
    | "item_added"
    | "item_updated"
    | "item_status_changed"
    | "item_deleted"
    | "issue_reported"
    | "issue_status_changed"
    | "item_photo_uploaded";
  payload: Record<string, unknown>;
};

export type Issue = {
  id: EntityId;
  at: string;
  reporter: string;
  itemId?: EntityId;
  summary: string;
  detail?: string;
  kind: "loss" | "damage" | "other";
  status: "open" | "resolved";
};

export type Floor = {
  id: EntityId;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

export type Area = {
  id: EntityId;
  name: string;
  floors: Floor[];
};
