import { type Task, type ID } from "@/types/app";
import { v4 as uuid } from "uuid";

const LS_KEY = "mvp_tasks";

function read(): Task[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function write(data: Task[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const TaskRepo = {
  async list(query?: { search?: string; status?: string }) {
    await delay();
    let data = read();
    if (query?.search) {
      const q = query.search.toLowerCase();
      data = data.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (query?.status) {
      data = data.filter((t) => t.status === query.status);
    }
    return data;
  },
  async get(id: ID) {
    await delay();
    return read().find((t) => t.id === id) || null;
  },
  async create(
    input: Omit<Task, "id" | "createdAt" | "itemIds" | "status"> & {
      status?: Task["status"];
    },
  ) {
    await delay();
    const t: Task = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      itemIds: [],
      status: input.status ?? "not_started",
      title: input.title,
      description: input.description,
      handler: input.handler,
    };
    const data = read();
    data.unshift(t);
    write(data);
    return t;
  },
  async update(id: ID, patch: Partial<Task>) {
    await delay();
    const data = read();
    const i = data.findIndex((t) => t.id === id);
    if (i === -1) return null;
    data[i] = { ...data[i], ...patch };
    write(data);
    return data[i];
  },
};

function delay(ms = 250) {
  return new Promise((res) => setTimeout(res, ms));
}