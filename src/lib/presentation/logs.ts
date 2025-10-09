import type {
  Issue,
  Item,
  ItemStatus,
  LogEvent,
  Task,
  TaskStatus,
} from "@/types/app";

function readString(
  payload: Record<string, unknown>,
  key: string
): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function isItemStatus(value: unknown): value is ItemStatus {
  if (typeof value !== "string") {
    return false;
  }

  return (
    value === "unplaced" ||
    value === "moving" ||
    value === "placed" ||
    value === "issue"
  );
}

function isIssueStatus(value: unknown): value is Issue["status"] {
  return value === "open" || value === "resolved";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  if (typeof value !== "string") {
    return false;
  }

  return value === "not_started" || value === "in_progress" || value === "done";
}

export type LogDescribeOptions = {
  getItemById?: (id: string) => Item | undefined;
  getTaskById?: (id: string) => Task | undefined;
};

export type LogDescription = {
  title: string;
  description?: string;
};

function describeTaskCreated(
  log: LogEvent,
  context: { taskTitle?: string }
): LogDescription {
  const explicitTitle = readString(log.payload, "title") ?? context.taskTitle;
  return {
    title: `${log.actor}が新しいタスクを登録しました`,
    description: explicitTitle ?? undefined,
  } satisfies LogDescription;
}

function describeItemAdded(
  log: LogEvent,
  context: { itemName?: string; taskTitle?: string }
): LogDescription {
  const createdItemName = readString(log.payload, "name") ?? context.itemName;
  const relatedTaskTitle = context.taskTitle ?? createdItemName ?? undefined;
  return {
    title: `${log.actor}が物品を追加しました`,
    description: relatedTaskTitle,
  } satisfies LogDescription;
}

function describeItemStatusChanged(
  log: LogEvent,
  context: { itemName?: string }
): LogDescription {
  const rawStatus = log.payload.status;
  const note = readString(log.payload, "note");
  const statusLabel = isItemStatus(rawStatus)
    ? statusLabelMap[rawStatus]
    : undefined;
  const targetLabel = context.itemName ?? "物品";
  const descriptionParts: string[] = [];

  if (statusLabel) {
    descriptionParts.push(`現在: ${statusLabel}`);
  }

  if (note) {
    descriptionParts.push(note);
  }

  return {
    title: `${log.actor}が${targetLabel}のステータスを更新`,
    description:
      descriptionParts.length > 0 ? descriptionParts.join(" / ") : undefined,
  } satisfies LogDescription;
}

function describeTaskStatusChanged(
  log: LogEvent,
  context: { taskTitle?: string }
): LogDescription {
  const statusValue = log.payload.status;
  const previousStatusValue = log.payload.previousStatus;
  const statusLabel = isTaskStatus(statusValue)
    ? taskStatusLabelMap.get(statusValue)
    : undefined;
  const previousLabel = isTaskStatus(previousStatusValue)
    ? taskStatusLabelMap.get(previousStatusValue)
    : undefined;

  const descriptionParts: string[] = [];
  if (statusLabel) {
    descriptionParts.push(`現在: ${statusLabel}`);
  }
  if (previousLabel) {
    descriptionParts.push(`前回: ${previousLabel}`);
  }

  const title = context.taskTitle
    ? `${log.actor}が${context.taskTitle}のステータスを更新`
    : `${log.actor}がタスクのステータスを更新`;

  return {
    title,
    description:
      descriptionParts.length > 0 ? descriptionParts.join(" / ") : undefined,
  } satisfies LogDescription;
}

function describeIssueReported(
  log: LogEvent,
  context: { itemName?: string }
): LogDescription {
  const summary = readString(log.payload, "summary");
  const target = context.itemName ? `${context.itemName}に関する問題` : "問題";
  return {
    title: `${log.actor}が${target}を報告`,
    description: summary ?? undefined,
  } satisfies LogDescription;
}

function describeIssueStatusChanged(log: LogEvent): LogDescription {
  const statusValue = log.payload.status;
  const summary = readString(log.payload, "summary");
  const statusLabel = isIssueStatus(statusValue)
    ? issueStatusLabelMap[statusValue]
    : undefined;

  const descriptionParts: string[] = [];
  if (summary) {
    descriptionParts.push(summary);
  }
  if (statusLabel) {
    descriptionParts.push(`現在: ${statusLabel}`);
  }

  return {
    title: `${log.actor}が問題のステータスを更新`,
    description:
      descriptionParts.length > 0 ? descriptionParts.join(" / ") : undefined,
  } satisfies LogDescription;
}

function describeItemPhotoUploaded(
  log: LogEvent,
  context: { itemName?: string }
): LogDescription {
  const note = readString(log.payload, "note");
  const target = context.itemName ?? "物品";
  return {
    title: `${log.actor}が${target}の写真を登録`,
    description: note ?? undefined,
  } satisfies LogDescription;
}

const statusLabelMap: Record<ItemStatus, string> = {
  issue: "問題あり",
  moving: "移動中",
  placed: "配置済み",
  unplaced: "未配置",
};

const issueStatusLabelMap: Record<Issue["status"], string> = {
  open: "対応中",
  resolved: "解決済み",
};

const taskStatusLabelMap = new Map<TaskStatus, string>([
  ["done", "完了"],
  ["in_progress", "進行中"],
  ["not_started", "未着手"],
]);

export function describeLog(
  log: LogEvent,
  options: LogDescribeOptions = {}
): LogDescription {
  const getItemById = options.getItemById;
  const getTaskById = options.getTaskById;
  const itemId = readString(log.payload, "itemId");
  const taskId = readString(log.payload, "taskId");
  const item = itemId ? getItemById?.(itemId) : undefined;
  const task = taskId ? getTaskById?.(taskId) : undefined;

  switch (log.type) {
    case "task_created":
      return describeTaskCreated(log, { taskTitle: task?.title });
    case "item_added":
      return describeItemAdded(log, {
        itemName: item?.name,
        taskTitle: task?.title,
      });
    case "item_status_changed":
      return describeItemStatusChanged(log, { itemName: item?.name });
    case "task_status_changed":
      return describeTaskStatusChanged(log, { taskTitle: task?.title });
    case "issue_reported":
      return describeIssueReported(log, { itemName: item?.name });
    case "issue_status_changed":
      return describeIssueStatusChanged(log);
    case "item_photo_uploaded":
      return describeItemPhotoUploaded(log, { itemName: item?.name });
    default:
      return {
        title: `${log.actor}の活動`,
      } satisfies LogDescription;
  }
}
