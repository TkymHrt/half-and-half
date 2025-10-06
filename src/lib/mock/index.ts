import { AreaRepository } from "./repositories/areas";
import { IssueRepository } from "./repositories/issues";
import { ItemRepository } from "./repositories/items";
import { LogRepository } from "./repositories/logs";
import { PhotoRepository } from "./repositories/photos";
import { TaskRepository } from "./repositories/tasks";
import {
  areaSeeds,
  issueSeeds,
  itemSeeds,
  logSeeds,
  photoSeeds,
  taskSeeds,
} from "./seeds";
import { hasKey, writeJson } from "./storage";

const SEED_MARKER_KEY = "mvp_seeded_v1";

export async function ensureSeed(): Promise<void> {
  const seeded = await hasKey(SEED_MARKER_KEY);
  if (seeded) {
    return;
  }

  await Promise.all([
    AreaRepository.setAll(areaSeeds),
    ItemRepository.setAll(itemSeeds),
    PhotoRepository.setAll(photoSeeds),
    TaskRepository.setAll(taskSeeds),
    LogRepository.setAll(logSeeds),
    IssueRepository.setAll(issueSeeds),
  ]);

  await writeJson(SEED_MARKER_KEY, { seededAt: new Date().toISOString() });
}
