import type { EntityId, LogEvent } from "@/types/app";
import { readJson, writeJson } from "../storage";

const STORAGE_KEY = "mvp_logs";
const DEFAULT_DELAY_MS = 100;

function delay(ms = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type LogQuery = {
  limit?: number;
  offset?: number;
  type?: LogEvent["type"];
  keyword?: string;
  startAt?: string;
  endAt?: string;
};

function collectStringValues(source: unknown): string[] {
  if (typeof source === "string") {
    return [source];
  }

  if (Array.isArray(source)) {
    const result: string[] = [];
    for (const value of source) {
      const nested = collectStringValues(value);
      if (nested.length > 0) {
        result.push(...nested);
      }
    }
    return result;
  }

  if (source && typeof source === "object") {
    const result: string[] = [];
    for (const value of Object.values(source as Record<string, unknown>)) {
      const nested = collectStringValues(value);
      if (nested.length > 0) {
        result.push(...nested);
      }
    }
    return result;
  }

  return [];
}

type NormalizedLogQuery = {
  type?: LogEvent["type"];
  keyword?: string;
  startTime?: number;
  endTime?: number;
};

function normalizeQuery(query?: LogQuery): NormalizedLogQuery {
  if (!query) {
    return {};
  }

  const keyword = query.keyword?.trim().toLowerCase();
  const startTime = query.startAt ? Date.parse(query.startAt) : Number.NaN;
  const endTime = query.endAt ? Date.parse(query.endAt) : Number.NaN;

  return {
    type: query.type,
    keyword: keyword && keyword.length > 0 ? keyword : undefined,
    startTime: Number.isFinite(startTime) ? startTime : undefined,
    endTime: Number.isFinite(endTime) ? endTime : undefined,
  } satisfies NormalizedLogQuery;
}

function matchesNormalizedQuery(
  log: LogEvent,
  query: NormalizedLogQuery
): boolean {
  if (query.type && log.type !== query.type) {
    return false;
  }

  const occurredTime = Date.parse(log.at);
  if (
    query.startTime !== undefined &&
    Number.isFinite(occurredTime) &&
    occurredTime < query.startTime
  ) {
    return false;
  }

  if (
    query.endTime !== undefined &&
    Number.isFinite(occurredTime) &&
    occurredTime > query.endTime
  ) {
    return false;
  }

  if (!query.keyword) {
    return true;
  }

  const candidates: string[] = [log.actor, log.id];
  const payloadStrings = collectStringValues(log.payload);
  if (payloadStrings.length > 0) {
    candidates.push(...payloadStrings);
  }

  for (const candidate of candidates) {
    if (candidate.length === 0) {
      continue;
    }

    if (candidate.toLowerCase().includes(query.keyword)) {
      return true;
    }
  }

  return false;
}

function compareLogsByNewest(a: LogEvent, b: LogEvent): number {
  const aTime = Date.parse(a.at);
  if (!Number.isFinite(aTime)) {
    const bTime = Date.parse(b.at);
    if (!Number.isFinite(bTime)) {
      return 0;
    }
    return 1;
  }

  const bTime = Date.parse(b.at);
  if (!Number.isFinite(bTime)) {
    return -1;
  }

  return bTime - aTime;
}

export const LogRepository = {
  async list(query?: LogQuery): Promise<LogEvent[]> {
    await delay();
    const data = await readJson<LogEvent[]>(STORAGE_KEY);
    if (!data) {
      return [];
    }

    const normalizedQuery = normalizeQuery(query);
    const filtered: LogEvent[] = [];
    for (const log of data) {
      if (matchesNormalizedQuery(log, normalizedQuery)) {
        filtered.push(log);
      }
    }

    filtered.sort(compareLogsByNewest);

    const start = query?.offset ?? 0;
    const end = query?.limit ? start + query.limit : undefined;
    return filtered.slice(start, end);
  },
  async add(event: LogEvent): Promise<void> {
    await delay();
    const data = (await readJson<LogEvent[]>(STORAGE_KEY)) ?? [];
    const next = [event, ...data];
    await writeJson(STORAGE_KEY, next);
  },
  async get(id: EntityId): Promise<LogEvent | null> {
    await delay();
    const data = await readJson<LogEvent[]>(STORAGE_KEY);
    if (!data) {
      return null;
    }

    return data.find((log) => log.id === id) ?? null;
  },
  async setAll(logs: LogEvent[]): Promise<void> {
    await writeJson(STORAGE_KEY, logs);
  },
};

export const LOGS_STORAGE_KEY = STORAGE_KEY;
