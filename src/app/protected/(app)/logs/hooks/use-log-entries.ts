import { useCallback, useMemo } from "react";
import type { Item, LogEvent, Task } from "@/types/app";

type LogQuery = {
  keyword?: string;
  startDate?: string;
  endDate?: string;
  logType?: string;
};

const END_OF_DAY_HOURS = 23;
const END_OF_DAY_MINUTES = 59;
const END_OF_DAY_SECONDS = 59;
const END_OF_DAY_MILLISECONDS = 999;

function filterByKeyword(
  log: LogEvent & { relatedItem?: Item; relatedTask?: Task },
  keyword: string
): boolean {
  const searchText = [
    log.actor,
    log.type,
    JSON.stringify(log.payload),
    log.relatedItem?.name,
    log.relatedTask?.title, // Task型のnameではなくtitleを使用
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchText.includes(keyword.toLowerCase());
}

function filterByDateRange(
  log: LogEvent,
  startDate?: string,
  endDate?: string
): boolean {
  const logDate = new Date(log.at);

  if (startDate) {
    const start = new Date(startDate);
    if (logDate < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(
      END_OF_DAY_HOURS,
      END_OF_DAY_MINUTES,
      END_OF_DAY_SECONDS,
      END_OF_DAY_MILLISECONDS
    );
    if (logDate > end) {
      return false;
    }
  }

  return true;
}

function filterByLogType(log: LogEvent, logType?: string): boolean {
  if (!logType || logType === "all") {
    return true;
  }
  return log.type.includes(logType);
}

export function useLogEntries(
  logs: LogEvent[],
  items: Item[],
  tasks: Task[],
  query: LogQuery
) {
  const enrichedLogs = useMemo(
    () =>
      logs.map((log) => {
        const itemId = log.payload.itemId as string | undefined;
        const taskId = log.payload.taskId as string | undefined;

        const relatedItem = itemId
          ? items.find((item) => item.id === itemId)
          : undefined;
        const relatedTask = taskId
          ? tasks.find((task) => task.id === taskId)
          : undefined;

        return {
          ...log,
          relatedItem,
          relatedTask,
        };
      }),
    [logs, items, tasks]
  );

  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      // キーワードフィルタ
      if (query.keyword && !filterByKeyword(log, query.keyword)) {
        return false;
      }

      // 日付フィルタ
      if (!filterByDateRange(log, query.startDate, query.endDate)) {
        return false;
      }

      // ログタイプフィルタ
      return filterByLogType(log, query.logType);
    });
  }, [enrichedLogs, query]);

  const sortedLogs = useMemo(
    () =>
      [...filteredLogs].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      ),
    [filteredLogs]
  );

  const appendLog = useCallback((_newLog: LogEvent) => {
    // 新しいログを既存のログの先頭に追加する実装は、
    // 親コンポーネントでlogsのstateを更新する必要があるため、
    // このフックでは実装しない（親から受け取る）
  }, []);

  return {
    logs: sortedLogs,
    appendLog,
    totalCount: filteredLogs.length,
  };
}
