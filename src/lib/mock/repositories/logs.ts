import { type LogEvent } from "@/types/app";
import { v4 as uuid } from "uuid";

const LS_KEY = "mvp_logs";

function read(): LogEvent[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function write(data: LogEvent[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const LogRepo = {
  async list() {
    await delay();
    // Sort by date descending
    return read().sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  },

  async create(input: Omit<LogEvent, "id" | "at">) {
    await delay();
    const log: LogEvent = {
      id: uuid(),
      at: new Date().toISOString(),
      ...input,
    };
    const data = read();
    data.unshift(log); // Add to the beginning for chronological order
    write(data);
    return log;
  },
};

function delay(ms = 50) { // Logs should be fast
  return new Promise((res) => setTimeout(res, ms));
}