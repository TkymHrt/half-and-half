import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { LogTypeFilter, ResolvedLogQuery } from "../types";
import { toIsoDateBoundary } from "../utils";

export function useLogFilters() {
  const [keywordInput, setKeywordInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<LogTypeFilter>("all");
  const deferredKeyword = useDeferredValue(keywordInput);

  const resolvedQuery = useMemo<ResolvedLogQuery>(() => {
    const trimmedKeyword = deferredKeyword.trim().toLowerCase();
    const keyword = trimmedKeyword.length > 0 ? trimmedKeyword : undefined;
    const startAt = toIsoDateBoundary(startDateInput, "start");
    const endAt = toIsoDateBoundary(endDateInput, "end");
    const startTime = startAt ? Date.parse(startAt) : Number.NaN;
    const endTime = endAt ? Date.parse(endAt) : Number.NaN;

    return {
      type: logTypeFilter === "all" ? undefined : logTypeFilter,
      keyword,
      startAt,
      endAt,
      startTime: Number.isFinite(startTime) ? startTime : undefined,
      endTime: Number.isFinite(endTime) ? endTime : undefined,
    } satisfies ResolvedLogQuery;
  }, [deferredKeyword, endDateInput, logTypeFilter, startDateInput]);

  const hasActiveFilters =
    logTypeFilter !== "all" ||
    keywordInput.trim().length > 0 ||
    startDateInput.length > 0 ||
    endDateInput.length > 0;

  const handleClearFilters = useCallback(() => {
    setKeywordInput("");
    setStartDateInput("");
    setEndDateInput("");
    setLogTypeFilter("all");
  }, []);

  return {
    keywordInput,
    startDateInput,
    endDateInput,
    logTypeFilter,
    setKeywordInput,
    setStartDateInput,
    setEndDateInput,
    setLogTypeFilter,
    resolvedQuery,
    hasActiveFilters,
    handleClearFilters,
  } as const;
}
