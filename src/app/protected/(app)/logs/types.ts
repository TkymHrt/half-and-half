import type { Issue, Item, LogEvent } from "@/types/app";

export type LogListEntry = {
  id: string;
  title: string;
  description?: string;
  actor: string;
  occurredAtText: string;
  relativeTime: string;
  type: LogEvent["type"];
  typeLabel: string;
  badgeClass: string;
  item?: Item;
  issueId?: string;
};

export type IssueStats = {
  total: number;
  open: number;
  resolved: number;
};

export type IssueListEntry = {
  issue: Issue;
  item?: Item;
};

export type LogTypeFilter = "all" | LogEvent["type"];

export type ResolvedLogQuery = {
  type?: LogEvent["type"];
  keyword?: string;
  startAt?: string;
  endAt?: string;
  startTime?: number;
  endTime?: number;
};
