/**
 * クライアント専用Repository抽象化層
 * "use client"コンポーネントでのみ使用可能
 */

import type {
  AreaRepositoryInterface,
  IssueRepositoryInterface,
  ItemRepositoryInterface,
  LogRepositoryInterface,
  PhotoRepositoryInterface,
  TaskRepositoryInterface,
} from "@/lib/repositories/types";
import type { Item, Task } from "@/types/app";

/**
 * 環境変数でRepository実装を判定
 */
export function getRepositoryType(): "mock" | "supabase" {
  return process.env.NEXT_PUBLIC_USE_SUPABASE === "true" ? "supabase" : "mock";
}

/**
 * Supabaseを使用しているかどうかを判定
 */
export function isUsingSupabase(): boolean {
  return getRepositoryType() === "supabase";
}

/**
 * TaskRepositoryの実装を動的に取得
 */
export async function createTaskRepository(): Promise<TaskRepositoryInterface> {
  const repositoryType = getRepositoryType();

  if (repositoryType === "supabase") {
    // Supabase実装を動的インポート（クライアント用）
    const { SupabaseTaskRepository } = await import(
      "@/lib/data/supabase/tasks"
    );
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    return new SupabaseTaskRepository(client);
  }

  // モック実装を動的インポート
  const { TaskRepository } = await import("@/lib/mock/repositories/tasks");

  // アダプターでインターフェース統一
  return {
    findAll: () => TaskRepository.list(),
    findById: (id: string) => TaskRepository.get(id),
    create: (task: Omit<Task, "id" | "itemIds" | "createdAt">) =>
      TaskRepository.create(task),
    update: async (
      id: string,
      updates: Partial<
        Pick<Task, "title" | "description" | "handler" | "status">
      >
    ) => {
      const result = await TaskRepository.update(id, updates);
      if (!result) {
        throw new Error(`Task with id ${id} not found`);
      }
      return result;
    },
    delete: async (id: string) => {
      await TaskRepository.delete(id);
    },
  };
}

/**
 * ItemRepositoryの実装を動的に取得
 */
export async function createItemRepository(): Promise<ItemRepositoryInterface> {
  const repositoryType = getRepositoryType();

  if (repositoryType === "supabase") {
    // Supabase実装を動的インポート（クライアント用）
    const { SupabaseItemRepository } = await import(
      "@/lib/data/supabase/items"
    );
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    return new SupabaseItemRepository(client);
  }

  // モック実装を動的インポート
  const { ItemRepository } = await import("@/lib/mock/repositories/items");

  // アダプターでインターフェース統一
  return {
    findAll: () => ItemRepository.list(), // 全アイテム取得
    findByTaskId: (taskId: string) => ItemRepository.list({ taskId }),
    findById: (id: string) => ItemRepository.get(id),
    create: async (item: Omit<Item, "id" | "pin" | "photoIds">) => {
      // createMany を使って単一アイテムを作成
      const items = await ItemRepository.createMany([item as Item]);
      const created = items[0];
      if (!created) {
        throw new Error("Failed to create item");
      }
      return created;
    },
    update: async (
      id: string,
      updates: Partial<
        Pick<
          Item,
          | "name"
          | "quantity"
          | "sourceName"
          | "targetName"
          | "handler"
          | "status"
        >
      >,
      _pickupLocationId?: string,
      _dropoffLocationId?: string
    ) => {
      // モック実装では位置情報は無視
      const result = await ItemRepository.update(id, updates);
      if (!result) {
        throw new Error(`Item with id ${id} not found`);
      }
      return result;
    },
    delete: async (id: string) => {
      await ItemRepository.delete(id);
    },
  };
}

/**
 * AreaRepositoryの実装を動的に取得
 */
export async function createAreaRepository(): Promise<AreaRepositoryInterface> {
  const repositoryType = getRepositoryType();

  if (repositoryType === "supabase") {
    // Supabase実装を動的インポート（クライアント用）
    const { SupabaseAreaRepository } = await import(
      "@/lib/data/supabase/areas"
    );
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    return new SupabaseAreaRepository(client);
  }

  // モック実装を動的インポート
  const { AreaRepository } = await import("@/lib/mock/repositories/areas");

  // アダプターでインターフェース統一 - モック実装はArea内にFloor情報が含まれている
  return {
    findAll: () => AreaRepository.list(),
    findById: (id: string) => AreaRepository.get(id),
    findFloorById: async (floorId: string) => {
      // モック実装では全エリアを取得してフロアを検索
      const areas = await AreaRepository.list();
      for (const area of areas) {
        const floor = area.floors?.find((f) => f.id === floorId);
        if (floor) {
          return floor;
        }
      }
      return null;
    },
    getFloorsByAreaId: async (areaId: string) => {
      const area = await AreaRepository.get(areaId);
      return area?.floors || [];
    },
  };
}

/**
 * PhotoRepositoryの実装を動的に取得
 */
export async function createPhotoRepository(): Promise<PhotoRepositoryInterface> {
  const repositoryType = getRepositoryType();

  if (repositoryType === "supabase") {
    // Supabase実装を動的インポート（クライアント用）
    const { SupabasePhotoRepository } = await import(
      "@/lib/data/supabase/photos"
    );
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    return new SupabasePhotoRepository(client);
  }

  // モック実装を動的インポート
  const { PhotoRepository } = await import("@/lib/mock/repositories/photos");

  // アダプターでインターフェース統一
  return {
    findByItemId: (itemId: string) => PhotoRepository.listByItem(itemId),
    findById: (id: string) => PhotoRepository.get(id),
    create: async (photo, _storagePath: string) => {
      // モック実装用にPhotoCreateInputに変換
      const createInput = {
        id: crypto.randomUUID(),
        itemId: photo.itemId,
        fileName: photo.fileName || "photo.jpg",
        mimeType: photo.mimeType,
        size: photo.size,
        note: photo.note,
        blob: new Blob([]), // モック用の空Blob
        createdAt: new Date().toISOString(),
      };
      return await PhotoRepository.create(createInput);
    },
    delete: async (id: string) => {
      await PhotoRepository.delete(id);
    },
    updateCaption: async (id: string, caption: string) => {
      // モック実装にはupdate機能がないため、get→createで代替
      const existing = await PhotoRepository.get(id);
      if (!existing) {
        throw new Error(`Photo with id ${id} not found`);
      }
      // キャプション更新は簡易実装として現在の値を返す
      return { ...existing, note: caption };
    },
  };
}

/**
 * IssueRepositoryの実装を動的に取得
 */
export async function createIssueRepository(): Promise<IssueRepositoryInterface> {
  const repositoryType = getRepositoryType();

  if (repositoryType === "supabase") {
    const { SupabaseIssueRepository } = await import(
      "@/lib/data/supabase/issues"
    );
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    return new SupabaseIssueRepository(client);
  }

  // Mock実装
  const { IssueRepository } = await import("@/lib/mock/repositories/issues");
  return {
    findAll: async () => await IssueRepository.list(),
    findByItemId: async (itemId: string) => {
      const allIssues = await IssueRepository.list();
      return allIssues.filter((issue) => issue.itemId === itemId);
    },
    findById: async (id: string) => await IssueRepository.get(id),
    create: async (issue, reportedBy = "system") =>
      await IssueRepository.create({
        reporter: reportedBy,
        summary: issue.summary,
        detail: issue.detail,
        kind: issue.kind,
        itemId: issue.itemId,
      }),
    updateStatus: async (
      id: string,
      status: "open" | "resolved",
      resolvedBy?: string
    ) => {
      const issue = await IssueRepository.get(id);
      if (!issue) {
        throw new Error(`Issue with id ${id} not found`);
      }
      const updated = await IssueRepository.update(id, {
        status,
        ...(resolvedBy && { resolvedBy }),
      });
      if (!updated) {
        throw new Error(`Failed to update issue with id ${id}`);
      }
      return updated;
    },
    delete: (_id: string) => {
      // Mock実装にはdelete機能がないため、エラーを投げる
      throw new Error("Delete operation not implemented in mock repository");
    },
  };
}

/**
 * LogRepositoryの実装を動的に取得
 */
export async function createLogRepository(): Promise<LogRepositoryInterface> {
  const repositoryType = getRepositoryType();

  if (repositoryType === "supabase") {
    const { SupabaseLogRepository } = await import("@/lib/data/supabase/logs");
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    return new SupabaseLogRepository(client);
  }

  // Mock実装
  const { LogRepository } = await import("@/lib/mock/repositories/logs");
  return {
    findAll: async () => await LogRepository.list(),
    findByTaskId: async (taskId: string) => {
      const allLogs = await LogRepository.list();
      return allLogs.filter(
        (log) =>
          log.payload.taskId === taskId ||
          (log.type === "task_created" && log.payload.id === taskId) ||
          (log.type === "task_updated" && log.payload.id === taskId)
      );
    },
    findByItemId: async (itemId: string) => {
      const allLogs = await LogRepository.list();
      return allLogs.filter(
        (log) =>
          log.payload.itemId === itemId ||
          (log.type === "item_added" && log.payload.id === itemId) ||
          (log.type === "item_updated" && log.payload.id === itemId)
      );
    },
    create: async (log) => {
      const logEvent = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        ...log,
      };
      await LogRepository.add(logEvent);
      return logEvent;
    },
    deleteOldLogs: (_daysOld?: number) => {
      // Mock実装にはdelete機能がないため、0を返す
      return Promise.resolve(0);
    },
  };
}
