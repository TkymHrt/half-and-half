import { useCallback, useEffect, useState } from "react";
import { createLogRepository } from "@/lib/repositories/client";
import type { LogEvent } from "@/types/app";

const INITIAL_LOGS_LIMIT = 50;
const MORE_LOGS_LIMIT = 25;

export function useLogFeed() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialLogs = useCallback(async () => {
    setIsLogsLoading(true);
    setLogsError(null);

    try {
      const logRepository = await createLogRepository();
      const initialLogs = await logRepository.findAll(INITIAL_LOGS_LIMIT); // 初期ログ取得

      setLogs(initialLogs);
      setHasMore(initialLogs.length === INITIAL_LOGS_LIMIT); // 制限数まで取得できた場合はまだデータがある可能性
    } catch {
      setLogsError(
        "ログの読み込みに失敗しました。時間をおいて再度お試しください。"
      );
    } finally {
      setIsLogsLoading(false);
    }
  }, []);

  const loadMoreLogs = useCallback(async () => {
    if (!hasMore || isLogsLoading) {
      return;
    }

    try {
      const logRepository = await createLogRepository();
      const moreLogs = await logRepository.findAll(MORE_LOGS_LIMIT); // 追加ログ取得

      if (moreLogs.length === 0) {
        setHasMore(false);
        return;
      }

      // 重複を避けるため、既存のログIDセットを作成
      const existingIds = new Set(logs.map((log) => log.id));
      const newLogs = moreLogs.filter((log) => !existingIds.has(log.id));

      setLogs((prev) => [...prev, ...newLogs]);
      setHasMore(moreLogs.length === MORE_LOGS_LIMIT); // 制限数まで取得できた場合はまだデータがある可能性
    } catch {
      setLogsError("追加ログの読み込みに失敗しました。");
    }
  }, [hasMore, isLogsLoading, logs]);

  const appendLog = useCallback((newLog: LogEvent) => {
    setLogs((prev) => [newLog, ...prev]);
  }, []);

  useEffect(() => {
    loadInitialLogs();
  }, [loadInitialLogs]);

  return {
    logs,
    isLogsLoading,
    logsError,
    hasMore,
    loadMoreLogs,
    appendLog,
  };
}
