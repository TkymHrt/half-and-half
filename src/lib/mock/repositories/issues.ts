import type { EntityId, Issue } from "@/types/app";
import { readJson, writeJson } from "../storage";

const STORAGE_KEY = "mvp_issues";
const DEFAULT_DELAY_MS = 130;
const ISSUE_ID_RADIX = 36;

function delay(ms = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type IssueQuery = {
  status?: Issue["status"];
};

type IssueCreateInput = {
  reporter: string;
  summary: string;
  detail?: string;
  kind: Issue["kind"];
  itemId?: EntityId;
};

export const IssueRepository = {
  async list(query?: IssueQuery): Promise<Issue[]> {
    await delay();
    const data = await readJson<Issue[]>(STORAGE_KEY);
    if (!data) {
      return [];
    }

    if (!query?.status) {
      return data;
    }

    return data.filter((issue) => issue.status === query.status);
  },
  async get(id: EntityId): Promise<Issue | null> {
    await delay();
    const data = await readJson<Issue[]>(STORAGE_KEY);
    if (!data) {
      return null;
    }

    return data.find((issue) => issue.id === id) ?? null;
  },
  async create(input: IssueCreateInput): Promise<Issue> {
    await delay();
    const data = (await readJson<Issue[]>(STORAGE_KEY)) ?? [];
    const now = Date.now();
    const newIssue: Issue = {
      id: `issue-${now.toString(ISSUE_ID_RADIX)}`,
      at: new Date(now).toISOString(),
      reporter: input.reporter,
      summary: input.summary,
      detail: input.detail,
      kind: input.kind,
      status: "open",
      itemId: input.itemId,
    };
    const next = [newIssue, ...data];
    await writeJson(STORAGE_KEY, next);
    return newIssue;
  },
  async update(
    id: EntityId,
    patch: Partial<Omit<Issue, "id" | "reporter" | "kind" | "itemId">>
  ): Promise<Issue | null> {
    await delay();
    const data = (await readJson<Issue[]>(STORAGE_KEY)) ?? [];
    const index = data.findIndex((issue) => issue.id === id);
    if (index === -1) {
      return null;
    }

    const updated: Issue = {
      ...data[index],
      ...patch,
    };
    const next = [...data.slice(0, index), updated, ...data.slice(index + 1)];
    await writeJson(STORAGE_KEY, next);
    return updated;
  },
  async setAll(issues: Issue[]): Promise<void> {
    await writeJson(STORAGE_KEY, issues);
  },
};

export const ISSUES_STORAGE_KEY = STORAGE_KEY;
