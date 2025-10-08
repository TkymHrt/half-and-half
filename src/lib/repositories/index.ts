/**
 * Repository抽象化層 - モックとSupabaseの切り替えを提供
 */

import type { Item, Task } from "@/types/app";

// Repository インターフェース定義
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
    >
  ): Promise<Item>;
  delete(id: string): Promise<void>;
};

// 実装タイプ
type RepositoryType = "mock" | "supabase";

// 環境変数で実装を切り替え（デフォルトはモック）
const REPOSITORY_TYPE: RepositoryType =
  process.env.NEXT_PUBLIC_USE_SUPABASE === "true" ? "supabase" : "mock";

/**
 * TaskRepository のファクトリー関数
 */
export async function createTaskRepository(): Promise<TaskRepositoryInterface> {
  if (REPOSITORY_TYPE === "supabase") {
    // Supabase実装をインポート
    const { createClientRepositories } = await import("@/lib/data/supabase");
    const repositories = createClientRepositories();
    return repositories.tasks;
  }

  // モック実装をインポート
  const mockRepo = await import("@/lib/mock/repositories/tasks");
  return {
    findAll: () => mockRepo.TaskRepository.list(),
    findById: (id: string) => mockRepo.TaskRepository.get(id),
    create: (task) =>
      mockRepo.TaskRepository.create({
        title: task.title,
        description: task.description,
        handler: task.handler,
        status: task.status,
      }),
    update: async (id, updates) => {
      const result = await mockRepo.TaskRepository.update(id, updates);
      if (!result) {
        throw new Error(`Task ${id} not found`);
      }
      return result;
    },
    delete: async (id) => {
      await mockRepo.TaskRepository.delete(id);
    },
  };
}

/**
 * ItemRepository のファクトリー関数
 */
export async function createItemRepository(): Promise<ItemRepositoryInterface> {
  if (REPOSITORY_TYPE === "supabase") {
    // Supabase実装をインポート
    const { createClientRepositories } = await import("@/lib/data/supabase");
    const repositories = createClientRepositories();
    return repositories.items;
  }

  // モック実装をインポート
  const mockRepo = await import("@/lib/mock/repositories/items");
  return {
    findByTaskId: (taskId) => {
      if (taskId === "") {
        // 全件取得の場合
        return mockRepo.ItemRepository.list();
      }
      return mockRepo.ItemRepository.list({ taskId });
    },
    findById: (id) => mockRepo.ItemRepository.get(id),
    create: (item) =>
      mockRepo.ItemRepository.createMany([
        {
          id: "temp", // モック側で適切なIDが生成される
          ...item,
          pin: undefined,
          photoIds: [],
        },
      ]).then((items) => items[0]),
    update: async (id, updates) => {
      const result = await mockRepo.ItemRepository.update(id, updates);
      if (!result) {
        throw new Error(`Item ${id} not found`);
      }
      return result;
    },
    delete: async (id) => {
      await mockRepo.ItemRepository.delete(id);
    },
  };
}

/**
 * 現在の実装タイプを取得
 */
export function getRepositoryType(): RepositoryType {
  return REPOSITORY_TYPE;
}

/**
 * Supabase使用中かどうかを判定
 */
export function isUsingSupabase(): boolean {
  return REPOSITORY_TYPE === "supabase";
}
