import type { EntityId, Item, ItemStatus } from "@/types/app";
import { readJson, writeJson } from "../storage";

const STORAGE_KEY = "mvp_items";

const DEFAULT_DELAY_MS = 140;

function delay(ms = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type ItemQuery = {
  taskId?: EntityId;
  status?: ItemStatus;
};

export const ItemRepository = {
  async list(query?: ItemQuery): Promise<Item[]> {
    await delay();
    const data = await readJson<Item[]>(STORAGE_KEY);
    if (!data) {
      return [];
    }

    return data.filter((item) => {
      if (query?.taskId && item.taskId !== query.taskId) {
        return false;
      }

      if (query?.status && item.status !== query.status) {
        return false;
      }

      return true;
    });
  },
  async createMany(items: Item[]): Promise<Item[]> {
    await delay();
    const data = (await readJson<Item[]>(STORAGE_KEY)) ?? [];
    const next = [...items, ...data];
    await writeJson(STORAGE_KEY, next);
    return items;
  },
  async get(id: EntityId): Promise<Item | null> {
    await delay();
    const data = await readJson<Item[]>(STORAGE_KEY);
    if (!data) {
      return null;
    }

    return data.find((item) => item.id === id) ?? null;
  },
  async setAll(items: Item[]): Promise<void> {
    await writeJson(STORAGE_KEY, items);
  },
  async update(id: EntityId, patch: Partial<Item>): Promise<Item | null> {
    await delay();
    const data = (await readJson<Item[]>(STORAGE_KEY)) ?? [];
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const updated = { ...data[index], ...patch } satisfies Item;
    const next = [...data.slice(0, index), updated, ...data.slice(index + 1)];
    await writeJson(STORAGE_KEY, next);
    return updated;
  },
};

export const ITEMS_STORAGE_KEY = STORAGE_KEY;
