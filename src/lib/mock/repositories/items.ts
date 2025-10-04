import { type Item, type ID } from "@/types/app";
import { v4 as uuid } from "uuid";

const LS_KEY = "mvp_items";

function read(): Item[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function write(data: Item[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const ItemRepo = {
  async list() {
    await delay();
    return read();
  },

  async listByTaskId(taskId: ID) {
    await delay();
    return read().filter((item) => item.taskId === taskId);
  },

  async get(id: ID) {
    await delay();
    return read().find((item) => item.id === id) || null;
  },

  async create(input: Omit<Item, "id" | "status"> & { status?: Item["status"] }) {
    await delay();
    const item: Item = {
      id: uuid(),
      ...input,
      status: input.status ?? "unplaced",
    };
    const data = read();
    data.push(item);
    write(data);
    return item;
  },

  async bulkCreate(inputs: (Omit<Item, "id" | "status"> & { status?: Item["status"] })[]) {
    await delay();
    const data = read();
    const newItems: Item[] = inputs.map((input) => ({
      id: uuid(),
      ...input,
      status: input.status ?? "unplaced",
    }));
    const updatedData = [...data, ...newItems];
    write(updatedData);
    return newItems;
  },

  async update(id: ID, patch: Partial<Item>) {
    await delay();
    const data = read();
    const i = data.findIndex((item) => item.id === id);
    if (i === -1) return null;
    data[i] = { ...data[i], ...patch };
    write(data);
    return data[i];
  },
};

function delay(ms = 250) {
  return new Promise((res) => setTimeout(res, ms));
}