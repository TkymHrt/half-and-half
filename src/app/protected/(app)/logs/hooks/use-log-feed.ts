import { useCallback, useEffect, useState } from "react";
import { ensureSeed } from "@/lib/mock";
import { LogRepository } from "@/lib/mock/repositories/logs";
import type { LogEvent } from "@/types/app";
import { LOG_PAGE_SIZE } from "../constants";
import type { ResolvedLogQuery } from "../types";
import { doesLogMatchFilters } from "../utils";

export function useLogFeed(query: ResolvedLogQuery) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const { type, keyword, startAt, endAt } = query;

  useEffect(() => {
    let isActive = true;

    async function fetchLogs() {
      setIsLogsLoading(true);
      setLogError(null);
      setLoadMoreError(null);

      try {
        await ensureSeed();
        const page = await LogRepository.list({
          type,
          keyword,
          startAt,
          endAt,
          limit: LOG_PAGE_SIZE,
          offset: 0,
        });

        if (!isActive) {
          return;
        }

        setLogs(page);
        setHasMore(page.length === LOG_PAGE_SIZE);
      } catch {
        if (!isActive) {
          return;
        }

        setLogs([]);
        setHasMore(false);
        setLogError("ログの読み込みに失敗しました。再度お試しください。");
      } finally {
        if (isActive) {
          setIsLogsLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    fetchLogs();

    return () => {
      isActive = false;
    };
  }, [endAt, keyword, startAt, type]);

  const loadMore = useCallback(async () => {
    if (isLogsLoading || isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const offset = logs.length;
      const next = await LogRepository.list({
        type,
        keyword,
        startAt,
        endAt,
        offset,
        limit: LOG_PAGE_SIZE,
      });
      setLogs((prev) => [...prev, ...next]);
      setHasMore(next.length === LOG_PAGE_SIZE);
    } catch {
      setLoadMoreError("追加のログ取得に失敗しました。");
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    endAt,
    hasMore,
    isLoadingMore,
    isLogsLoading,
    keyword,
    logs.length,
    startAt,
    type,
  ]);

  const appendLog = useCallback(
    (log: LogEvent) => {
      if (!doesLogMatchFilters(log, query)) {
        return;
      }

      setLogs((prev) => [log, ...prev]);
    },
    [query]
  );

  return {
    logs,
    hasMore,
    isLogsLoading,
    isLoadingMore,
    logError,
    loadMoreError,
    loadMore,
    appendLog,
  } as const;
}
