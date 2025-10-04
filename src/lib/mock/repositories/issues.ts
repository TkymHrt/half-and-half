import { type Issue, type ID } from "@/types/app";
import { v4 as uuid } from "uuid";

const LS_KEY = "mvp_issues";

function read(): Issue[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function write(data: Issue[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const IssueRepo = {
  async list() {
    await delay();
    return read().sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  },

  async get(id: ID) {
    await delay();
    return read().find((issue) => issue.id === id) || null;
  },

  async create(input: Omit<Issue, "id" | "at" | "status">) {
    await delay();
    const issue: Issue = {
      id: uuid(),
      at: new Date().toISOString(),
      status: "open",
      ...input,
    };
    const data = read();
    data.unshift(issue);
    write(data);
    return issue;
  },

  async update(id: ID, patch: Partial<Issue>) {
    await delay();
    const data = read();
    const i = data.findIndex((issue) => issue.id === id);
    if (i === -1) return null;
    data[i] = { ...data[i], ...patch };
    write(data);
    return data[i];
  },
};

function delay(ms = 250) {
  return new Promise((res) => setTimeout(res, ms));
}