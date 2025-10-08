/**
 * Repository インターフェース定義
 */

import type {
  Area,
  Floor,
  Issue,
  Item,
  ItemPhoto,
  LogEvent,
  Task,
} from "@/types/app";

export type TaskRepositoryInterface = {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(task: Omit<Task, "id" | "itemIds" | "createdAt">): Promise<Task>;
  update(
    id: string,
    updates: Partial<Pick<Task, "title" | "description" | "handler" | "status">>
  ): Promise<Task>;
  delete(id: string): Promise<void>;
};

export type ItemRepositoryInterface = {
  findAll(): Promise<Item[]>; // 全アイテム取得用（必須に変更）
  findByTaskId(taskId: string): Promise<Item[]>;
  findById(id: string): Promise<Item | null>;
  create(item: Omit<Item, "id" | "pin" | "photoIds">): Promise<Item>;
  update(
    id: string,
    updates: Partial<
      Pick<
        Item,
        "name" | "quantity" | "sourceName" | "targetName" | "handler" | "status"
      >
    >,
    pickupLocationId?: string,
    dropoffLocationId?: string
  ): Promise<Item>;
  delete(id: string): Promise<void>;
};

export type PhotoRepositoryInterface = {
  findByItemId(itemId: string): Promise<ItemPhoto[]>;
  findById(id: string): Promise<ItemPhoto | null>;
  create(
    photo: Omit<ItemPhoto, "id" | "createdAt" | "hasBlob">,
    storagePath: string
  ): Promise<ItemPhoto>;
  delete(id: string): Promise<void>;
  updateCaption(id: string, caption: string): Promise<ItemPhoto>;
};

export type LogRepositoryInterface = {
  findAll(limit?: number): Promise<LogEvent[]>;
  findByTaskId(taskId: string, limit?: number): Promise<LogEvent[]>;
  findByItemId(itemId: string, limit?: number): Promise<LogEvent[]>;
  create(
    logEvent: Omit<LogEvent, "id" | "at">,
    actorProfileId?: string
  ): Promise<LogEvent>;
  deleteOldLogs(daysOld?: number): Promise<number>;
};

export type IssueRepositoryInterface = {
  findAll(): Promise<Issue[]>;
  findByItemId(itemId: string): Promise<Issue[]>;
  findById(id: string): Promise<Issue | null>;
  create(issue: Omit<Issue, "id" | "at">, reportedBy?: string): Promise<Issue>;
  updateStatus(
    id: string,
    status: "open" | "resolved",
    resolvedBy?: string
  ): Promise<Issue>;
  delete(id: string): Promise<void>;
};

export type AreaRepositoryInterface = {
  findAll(): Promise<Area[]>;
  findById(id: string): Promise<Area | null>;
  findFloorById(floorId: string): Promise<Floor | null>;
  getFloorsByAreaId(areaId: string): Promise<Floor[]>;
};
