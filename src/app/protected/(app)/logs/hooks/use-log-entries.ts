import { format, formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { useMemo } from "react";
import { describeLog } from "@/lib/presentation/logs";
import type { Item, LogEvent, Task } from "@/types/app";
import { LOG_TYPE_BADGE_CLASS, LOG_TYPE_LABEL } from "../constants";
import type { LogListEntry } from "../types";

export function useLogEntries(
  logs: LogEvent[],
  itemsById: Map<string, Item>,
  tasksById: Map<string, Task>
) {
  return useMemo(() => {
    if (logs.length === 0) {
      return [] as LogListEntry[];
    }

    return logs.map((log) => {
      const occurredAt = new Date(log.at);
      const occurredAtText = format(occurredAt, "yyyy/MM/dd HH:mm");
      const relativeTime = formatDistanceToNowStrict(occurredAt, {
        addSuffix: true,
        locale: ja,
      });
      const { title, description } = describeLog(log, {
        getItemById: (id) => itemsById.get(id),
        getTaskById: (id) => tasksById.get(id),
      });
      const itemId =
        typeof log.payload.itemId === "string" ? log.payload.itemId : undefined;
      const issueId =
        typeof log.payload.issueId === "string"
          ? log.payload.issueId
          : undefined;
      const item = itemId ? itemsById.get(itemId) : undefined;
      const typeLabel = LOG_TYPE_LABEL.get(log.type) ?? "";

      return {
        id: log.id,
        title,
        description,
        actor: log.actor,
        occurredAtText,
        relativeTime,
        type: log.type,
        typeLabel,
        badgeClass: LOG_TYPE_BADGE_CLASS.get(log.type) ?? "",
        item,
        issueId,
      } satisfies LogListEntry;
    });
  }, [itemsById, logs, tasksById]);
}
