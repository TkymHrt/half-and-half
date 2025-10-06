import type { Area, EntityId } from "@/types/app";
import { readJson, writeJson } from "../storage";

const STORAGE_KEY = "mvp_areas";

const DEFAULT_DELAY_MS = 120;

function delay(ms = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const AreaRepository = {
  async list(): Promise<Area[]> {
    await delay();
    const data = await readJson<Area[]>(STORAGE_KEY);
    return data ?? [];
  },
  async get(id: EntityId): Promise<Area | null> {
    await delay();
    const data = await readJson<Area[]>(STORAGE_KEY);
    if (!data) {
      return null;
    }

    return data.find((area) => area.id === id) ?? null;
  },
  async setAll(areas: Area[]): Promise<void> {
    await writeJson(STORAGE_KEY, areas);
  },
};

export const AREAS_STORAGE_KEY = STORAGE_KEY;
