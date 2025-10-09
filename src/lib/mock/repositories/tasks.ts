import type { EntityId, Task, TaskStatus } from "@/types/app";
import { readJson, writeJson } from "../storage";

const STORAGE_KEY = "mvp_tasks";
const DEFAULT_DELAY_MS = 160;
const TASK_ID_RADIX = 36;

function delay(ms = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type TaskQuery = {
  search?: string;
  status?: TaskStatus;
};

type TaskCreateInput = {
  title: string;
  description?: string;
  handler?: string;
  status?: TaskStatus;
  itemIds?: EntityId[];
};

export const TaskRepository = {
  async list(query?: TaskQuery): Promise<Task[]> {
    await delay();
    const data = await readJson<Task[]>(STORAGE_KEY);
    if (!data) {
      return [];
    }

    return data.filter((task) => {
      if (query?.status && task.status !== query.status) {
        return false;
      }

      if (query?.search) {
        const normalized = query.search.trim().toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(normalized);
        const matchesHandler =
          task.handler?.toLowerCase().includes(normalized) ?? false;
        const hasMatch = matchesTitle || matchesHandler;
        if (!hasMatch) {
          return false;
        }
      }

      return true;
    });
  },
  async get(id: EntityId): Promise<Task | null> {
    await delay();
    const data = await readJson<Task[]>(STORAGE_KEY);
    if (!data) {
      return null;
    }

    return data.find((task) => task.id === id) ?? null;
  },
  async create(input: TaskCreateInput): Promise<Task> {
    await delay();
    const data = (await readJson<Task[]>(STORAGE_KEY)) ?? [];
    const now = Date.now();
    const newTask: Task = {
      id: `task-${now.toString(TASK_ID_RADIX)}`,
      title: input.title,
      description: input.description,
      handler: input.handler,
      status: input.status ?? "not_started",
      itemIds: input.itemIds ?? [],
      createdAt: new Date(now).toISOString(),
    };
    const next = [newTask, ...data];
    await writeJson(STORAGE_KEY, next);
    return newTask;
  },
  async update(
    id: EntityId,
    patch: Partial<Omit<Task, "id">>
  ): Promise<Task | null> {
    await delay();
    const data = (await readJson<Task[]>(STORAGE_KEY)) ?? [];
    const index = data.findIndex((task) => task.id === id);
    if (index === -1) {
      return null;
    }

    const updated: Task = {
      ...data[index],
      ...patch,
    };
    const next = [...data.slice(0, index), updated, ...data.slice(index + 1)];
    await writeJson(STORAGE_KEY, next);
    return updated;
  },
  async delete(id: EntityId): Promise<boolean> {
    await delay();
    const data = (await readJson<Task[]>(STORAGE_KEY)) ?? [];
    const filtered = data.filter((task) => task.id !== id);
    if (filtered.length === data.length) {
      return false;
    }
    await writeJson(STORAGE_KEY, filtered);
    return true;
  },
  async setAll(tasks: Task[]): Promise<void> {
    await writeJson(STORAGE_KEY, tasks);
  },
};

export const TASKS_STORAGE_KEY = STORAGE_KEY;
