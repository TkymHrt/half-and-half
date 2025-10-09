import { useCallback, useMemo, useState } from "react";
import type { LogTypeFilter } from "../types";

export function useLogFilters() {
  const [keywordInput, setKeywordInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<LogTypeFilter>("all");

  const resolvedQuery = useMemo(
    () => ({
      keyword: keywordInput.trim() || undefined,
      startDate: startDateInput || undefined,
      endDate: endDateInput || undefined,
      logType: logTypeFilter === "all" ? undefined : logTypeFilter,
    }),
    [keywordInput, startDateInput, endDateInput, logTypeFilter]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        keywordInput.trim() ||
          startDateInput ||
          endDateInput ||
          (logTypeFilter && logTypeFilter !== "all")
      ),
    [keywordInput, startDateInput, endDateInput, logTypeFilter]
  );

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
    setLogTypeFilter: (value: LogTypeFilter) => setLogTypeFilter(value),
    resolvedQuery,
    hasActiveFilters,
    handleClearFilters,
  };
}
