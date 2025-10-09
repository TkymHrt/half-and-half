import type { LogEvent, Item, Task } from "@/types/app";
import type { LogListEntry } from "./types";
import { LOG_TYPE_LABEL } from "./constants";

export function formatIssueDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function logEventToLogListEntry(
  log: LogEvent & { relatedItem?: Item; relatedTask?: Task }
): LogListEntry {
  const typeLabel = LOG_TYPE_LABEL[log.type] || log.type;
  
  // タイトルを生成
  let title: string = typeLabel;
  if (log.relatedTask) {
    title = `${log.relatedTask.title} - ${typeLabel}`;
  } else if (log.relatedItem) {
    title = `${log.relatedItem.name} - ${typeLabel}`;
  }

  // 説明を生成
  let description: string | undefined;
  if (log.payload && Object.keys(log.payload).length > 0) {
    try {
      description = JSON.stringify(log.payload);
    } catch {
      description = undefined;
    }
  }

  // 日付フォーマット
  const occurredAtText = formatIssueDate(log.at);
  const relativeTime = new Intl.RelativeTimeFormat("ja", { 
    numeric: "auto" 
  }).format(-1, "hour"); // 簡易実装

  return {
    ...log,
    title,
    description,
    typeLabel,
    occurredAtText,
    relativeTime,
    item: log.relatedItem, // legacy support
  };
}
