import type { Issue, Item, LogEvent, Task } from "@/types/app";

export type LogTypeFilter = "all" | "task" | "item" | "issue";

export type LogListEntry = LogEvent & {
  relatedItem?: Item;
  relatedTask?: Task;
};

export type IssueListEntry = {
  issue: Issue;
  item?: Item;
};
