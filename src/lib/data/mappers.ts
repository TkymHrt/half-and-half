/* eslint-disable @typescript-eslint/naming-convention */

import type {
  Area,
  Floor,
  Issue,
  Item,
  ItemPhoto,
  ItemStatus,
  LocationPin,
  LogEvent,
  Task,
  TaskStatus,
} from "@/types/app";
import type { Database } from "@/types/supabase";

// Supabase型のエイリアス
type DbTask = Database["public"]["Tables"]["tasks"]["Row"];
type DbTaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type DbTaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
type DbItem = Database["public"]["Tables"]["task_items"]["Row"];
type DbItemInsert = Database["public"]["Tables"]["task_items"]["Insert"];
type DbItemUpdate = Database["public"]["Tables"]["task_items"]["Update"];
type DbPhoto = Database["public"]["Tables"]["task_item_photos"]["Row"];
type DbPhotoInsert = Database["public"]["Tables"]["task_item_photos"]["Insert"];
type DbLog = Database["public"]["Tables"]["activity_logs"]["Row"];
type DbLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];
type DbIssue = Database["public"]["Tables"]["task_item_issues"]["Row"];
type DbIssueInsert = Database["public"]["Tables"]["task_item_issues"]["Insert"];
type DbArea = Database["public"]["Tables"]["areas"]["Row"];
type DbFloor = Database["public"]["Tables"]["floors"]["Row"];
type DbLocation = Database["public"]["Tables"]["locations"]["Row"];

// =============================================================================
// Task 変換
// =============================================================================

export function dbTaskToTask(dbTask: DbTask, itemIds: string[] = []): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || undefined,
    handler: dbTask.handler_label || undefined, // handler_label に修正
    status: dbTask.status as TaskStatus,
    itemIds,
    createdAt: dbTask.created_at,
  };
}

export function taskToDbTaskInsert(
  task: Omit<Task, "id" | "itemIds" | "createdAt">
): DbTaskInsert {
  return {
    title: task.title,
    description: task.description || null,
    handler_label: task.handler || null, // handler_label に修正
    status: task.status,
  };
}

export function taskToDbTaskUpdate(
  task: Partial<Pick<Task, "title" | "description" | "handler" | "status">>
): DbTaskUpdate {
  return {
    title: task.title,
    description: task.description || null,
    handler_label: task.handler || null, // handler_label に修正
    status: task.status,
  };
}

// =============================================================================
// Item 変換
// =============================================================================

export function dbItemToItem(
  dbItem: DbItem,
  pin?: LocationPin,
  photoIds: string[] = []
): Item {
  return {
    id: dbItem.id,
    taskId: dbItem.task_id,
    name: dbItem.name,
    quantity: dbItem.quantity,
    sourceName: dbItem.notes || "", // notes カラムを sourceName として使用
    targetName: dbItem.notes || "", // notes カラムを targetName として使用（暫定）
    handler: dbItem.handler_label || undefined,
    status: dbItem.status as ItemStatus,
    pin,
    photoIds,
  };
}

export function itemToDbItemInsert(
  item: Omit<Item, "id" | "pin" | "photoIds">
): DbItemInsert {
  return {
    task_id: item.taskId,
    name: item.name,
    quantity: item.quantity,
    notes: `${item.sourceName} → ${item.targetName}`, // sourceName と targetName を notes として保存
    handler_label: item.handler || null,
    status: item.status,
    // pin の location_id は別途設定が必要
    pickup_location_id: null,
    dropoff_location_id: null,
  };
}

export function itemToDbItemUpdate(
  item: Partial<
    Pick<
      Item,
      "name" | "quantity" | "sourceName" | "targetName" | "handler" | "status"
    >
  >,
  pickupLocationId?: string,
  dropoffLocationId?: string
): DbItemUpdate {
  return {
    name: item.name,
    quantity: item.quantity,
    notes: `${item.sourceName} → ${item.targetName}`, // sourceName と targetName を notes として保存
    handler_label: item.handler || null,
    status: item.status,
    pickup_location_id: pickupLocationId || null,
    dropoff_location_id: dropoffLocationId || null,
  };
}

// =============================================================================
// ItemPhoto 変換
// =============================================================================

export function dbPhotoToItemPhoto(
  dbPhoto: DbPhoto,
  previewDataUrl?: string
): ItemPhoto {
  // ファイル名を storage_path から抽出
  const fileName = dbPhoto.storage_path.split("/").pop();

  return {
    id: dbPhoto.id,
    itemId: dbPhoto.task_item_id,
    fileName,
    mimeType: dbPhoto.content_type, // content_type を使用
    size: dbPhoto.size_bytes, // size_bytes を使用
    createdAt: dbPhoto.created_at,
    note: dbPhoto.caption || undefined,
    hasBlob: !!previewDataUrl, // Storage URLが存在するかで判定
    previewDataUrl,
  };
}

export function itemPhotoToDbPhotoInsert(
  photo: Omit<ItemPhoto, "id" | "createdAt" | "hasBlob">,
  storagePath: string
): DbPhotoInsert {
  return {
    task_item_id: photo.itemId,
    storage_path: storagePath,
    content_type: photo.mimeType, // content_type を使用
    size_bytes: photo.size, // size_bytes を使用
    caption: photo.note || null,
    kind: "pickup", // デフォルト値、必要に応じて引数で受け取る
  };
}

// =============================================================================
// LogEvent 変換
// =============================================================================

export function dbLogToLogEvent(dbLog: DbLog): LogEvent {
  return {
    id: dbLog.id.toString(), // number を string に変換
    at: dbLog.created_at, // timestamp フィールド名の違いに注意
    actor: dbLog.actor_name,
    type: dbLog.event_type,
    payload: (dbLog.details as Record<string, unknown>) || {},
  };
}

export function logEventToDbLogInsert(
  logEvent: Omit<LogEvent, "id" | "at">,
  actorProfileId?: string
): DbLogInsert {
  return {
    actor_name: logEvent.actor,
    actor_profile_id: actorProfileId || null,
    event_type: logEvent.type,
    details: JSON.parse(JSON.stringify(logEvent.payload)), // JSONシリアライズでJson型に変換
    task_id: (logEvent.payload.taskId as string) || null,
    task_item_id: (logEvent.payload.itemId as string) || null,
  };
}

// =============================================================================
// Issue 変換
// =============================================================================

export function dbIssueToIssue(dbIssue: DbIssue): Issue {
  return {
    id: dbIssue.id,
    at: dbIssue.created_at, // timestamp フィールド名の違いに注意
    reporter: dbIssue.reported_by, // reported_by を使用
    itemId: dbIssue.task_item_id || undefined,
    summary: dbIssue.summary, // summary フィールドを直接使用
    detail: dbIssue.detail || undefined, // detail フィールドを使用
    kind: dbIssue.kind,
    status: dbIssue.status,
  };
}

export function issueToDbIssueInsert(
  issue: Omit<Issue, "id" | "at">,
  reportedBy?: string
): DbIssueInsert {
  return {
    task_item_id: issue.itemId || "", // task_item_id は必須なので空文字列をデフォルトに
    kind: issue.kind,
    summary: issue.summary, // summary フィールドを直接使用
    detail: issue.detail || null, // detail フィールドを使用
    reported_by: reportedBy || "", // reported_by は必須なので空文字列をデフォルトに
    status: issue.status,
  };
}

// =============================================================================
// Area/Floor 変換
// =============================================================================

export function dbAreaToArea(dbArea: DbArea, floors: Floor[]): Area {
  return {
    id: dbArea.id,
    name: dbArea.name,
    floors,
  };
}

export function dbFloorToFloor(dbFloor: DbFloor): Floor {
  return {
    id: dbFloor.id,
    name: dbFloor.name,
    imageUrl: dbFloor.image_path, // image_path を使用
    width: dbFloor.width_px, // width_px を使用
    height: dbFloor.height_px, // height_px を使用
  };
}

// =============================================================================
// LocationPin 変換ヘルパー
// =============================================================================

export function dbLocationsToLocationPin(
  pickupLocation?: DbLocation & { floor: DbFloor & { area: DbArea } },
  dropoffLocation?: DbLocation & { floor: DbFloor & { area: DbArea } }
): LocationPin | undefined {
  if (!(pickupLocation || dropoffLocation)) {
    return;
  }

  // 基準となるLocation（pickup優先、なければdropoff）
  const baseLocation = pickupLocation || dropoffLocation;
  if (!baseLocation) return;

  return {
    areaId: baseLocation.floor.area.id,
    floorId: baseLocation.floor.id,
    source: pickupLocation
      ? {
          x: pickupLocation.coord_x, // coord_x を使用
          y: pickupLocation.coord_y, // coord_y を使用
        }
      : undefined,
    target: dropoffLocation
      ? {
          x: dropoffLocation.coord_x, // coord_x を使用
          y: dropoffLocation.coord_y, // coord_y を使用
        }
      : undefined,
  };
}
