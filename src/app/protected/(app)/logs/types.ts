import type { Issue, Item, LogEvent, Task } from "@/types/app";

export type LogTypeFilter = "all" | "task" | "item" | "issue";

export type LogListEntry = LogEvent & {
  relatedItem?: Item;
  relatedTask?: Task;
  title: string;
  description?: string;
  typeLabel: string;
  occurredAtText: string;
  relativeTime: string;
  item?: Item; // legacy support
};

export type IssueListEntry = {
  issue: Issue;
  item?: Item;
};

export type IssueStats = {
  total: number;
  open: number;
  resolved: number;
};
