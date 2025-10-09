"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/app/header";
import { IssueReportDialog } from "@/components/app/issue-report-dialog";
import { IssueListCard } from "@/components/app/logs/issue-list-card";
import { IssueSummaryCard } from "@/components/app/logs/issue-summary-card";
import type { LogFiltersFormProps } from "@/components/app/logs/log-filters";
import { LogListCard } from "@/components/app/logs/log-list-card";
import { Button } from "@/components/ui/button";
import type { Issue, LogEvent } from "@/types/app";
import { useBootstrapData } from "./hooks/use-bootstrap-data";
import { useInfiniteScroll } from "./hooks/use-infinite-scroll";
import { useIssueActions } from "./hooks/use-issue-actions";
import { useIssueData } from "./hooks/use-issue-data";
import { useLogEntries } from "./hooks/use-log-entries";
import { useLogFeed } from "./hooks/use-log-feed";
import { useLogFilters } from "./hooks/use-log-filters";

export default function LogsPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    items,
    tasks,
    issues,
    setIssues,
    isBootstrapLoading,
    bootstrapError,
  } = useBootstrapData();

  const {
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
  } = useLogFilters();

  const {
    logs,
    hasMore,
    isLogsLoading,
    isLoadingMore,
    logError,
    loadMoreError,
    loadMore,
    appendLog,
  } = useLogFeed(resolvedQuery);

  const { updatingIssueId, issueActionError, handleToggleIssueStatus } =
    useIssueActions(appendLog, setIssues);

  const isInitialLoading = isBootstrapLoading || isLogsLoading;
  const initialError = bootstrapError ?? logError;

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items]
  );

  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task] as const)),
    [tasks]
  );

  const { issueStats, issueEntries } = useIssueData(issues, itemsById);

  const logEntries = useLogEntries(logs, itemsById, tasksById);
  const handleIssueSubmitted = useCallback(
    (context: { issue: Issue; log: LogEvent }) => {
      setIssues((prev) => [context.issue, ...prev]);
      appendLog(context.log);
    },
    [appendLog, setIssues]
  );
  const isEmptyState = !isInitialLoading && logEntries.length === 0;
  const hasPendingIssueUpdate = updatingIssueId !== null;

  const logFiltersFormProps: LogFiltersFormProps = {
    keyword: keywordInput,
    startDate: startDateInput,
    endDate: endDateInput,
    logType: logTypeFilter,
    hasActiveFilters,
    disabled: isInitialLoading,
    onKeywordChange: setKeywordInput,
    onStartDateChange: setStartDateInput,
    onEndDateChange: setEndDateInput,
    onLogTypeChange: setLogTypeFilter,
    onClear: handleClearFilters,
  } as const;

  useInfiniteScroll(loadMoreRef, {
    enabled: hasMore,
    onLoadMore: loadMore,
  });

  return (
    <>
      <IssueReportDialog
        items={items}
        onOpenChange={setDialogOpen}
        onSubmitted={handleIssueSubmitted}
        open={isDialogOpen}
      />

      <AppHeader
        action={
          <Button
            disabled={isInitialLoading}
            onClick={() => setDialogOpen(true)}
            size="sm"
            type="button"
          >
            問題を報告
          </Button>
        }
        title="ログ"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
        <IssueSummaryCard stats={issueStats} />
        <IssueListCard
          entries={issueEntries}
          error={issueActionError}
          hasPendingUpdate={hasPendingIssueUpdate}
          isInitialLoading={isInitialLoading}
          issuesCount={issues.length}
          onToggleIssue={handleToggleIssueStatus}
          updatingIssueId={updatingIssueId}
        />
        <LogListCard
          entries={logEntries}
          filters={logFiltersFormProps}
          hasMore={hasMore}
          initialError={initialError}
          isEmptyState={isEmptyState}
          isInitialLoading={isInitialLoading}
          isLoadingMore={isLoadingMore}
          loadMoreError={loadMoreError}
          loadMoreRef={loadMoreRef}
        />
      </div>
    </>
  );
}
