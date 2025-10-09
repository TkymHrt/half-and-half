"use client";

import { useRef, useState } from "react";
import { AppHeader } from "@/components/app/header";
import { IssueReportDialog } from "@/components/app/issue-report-dialog";
import { IssueListCard } from "@/components/app/logs/issue-list-card";
import { IssueSummaryCard } from "@/components/app/logs/issue-summary-card";
import { LogFilters } from "@/components/app/logs/log-filters";
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
import { logEventToLogListEntry } from "./utils";

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
    logs: rawLogs,
    hasMore,
    isLogsLoading,
    logsError,
    loadMoreLogs,
    appendLog: appendLogToFeed,
  } = useLogFeed();

  const { logs, appendLog } = useLogEntries(
    rawLogs,
    items,
    tasks,
    resolvedQuery
  );

  const { openIssues, resolvedIssues, issueStats } = useIssueData(issues);

  const { handleToggleIssueStatus, updatingIssueId, issueActionError } =
    useIssueActions(appendLog, setIssues);

  useInfiniteScroll(loadMoreRef, loadMoreLogs, hasMore, isLogsLoading);

  const handleIssueCreated = (newIssue: Issue) => {
    setIssues((prev) => [...prev, newIssue]);
  };

  const handleLogCreated = (newLog: LogEvent) => {
    appendLogToFeed(newLog);
    appendLog(newLog);
  };

  if (bootstrapError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="ログ・問題管理" />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">{bootstrapError}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              再試行
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="ログ・問題管理" />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-bold text-3xl text-gray-900">ログ・問題管理</h1>
          <Button onClick={() => setDialogOpen(true)}>問題を報告</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ログセクション */}
          <div className="space-y-6 lg:col-span-2">
            <LogFilters
              disabled={isBootstrapLoading}
              endDate={endDateInput}
              hasActiveFilters={hasActiveFilters}
              keyword={keywordInput}
              logType={logTypeFilter}
              onClear={handleClearFilters}
              onEndDateChange={setEndDateInput}
              onKeywordChange={setKeywordInput}
              onLogTypeChange={setLogTypeFilter}
              onStartDateChange={setStartDateInput}
              startDate={startDateInput}
            />

            <LogListCard
              entries={logs.map((log) => logEventToLogListEntry(log))}
              filters={{
                keyword: keywordInput,
                startDate: startDateInput,
                endDate: endDateInput,
                logType: logTypeFilter,
                hasActiveFilters,
                disabled: isBootstrapLoading,
                onKeywordChange: setKeywordInput,
                onStartDateChange: setStartDateInput,
                onEndDateChange: setEndDateInput,
                onLogTypeChange: setLogTypeFilter,
                onClear: handleClearFilters,
              }}
              hasMore={hasMore}
              initialError={logsError}
              isEmptyState={logs.length === 0 && !isLogsLoading}
              isInitialLoading={isBootstrapLoading || isLogsLoading}
              isLoadingMore={isLogsLoading && logs.length > 0}
              loadMoreError={null}
              loadMoreRef={loadMoreRef}
            />
          </div>

          {/* 問題管理セクション */}
          <div className="space-y-6">
            <IssueSummaryCard stats={issueStats} />

            <IssueListCard
              entries={openIssues.map((issue) => ({
                issue,
                item: items.find((item) => item.id === issue.itemId),
              }))}
              error={issueActionError}
              hasPendingUpdate={Boolean(updatingIssueId)}
              isInitialLoading={isBootstrapLoading}
              issuesCount={openIssues.length}
              onToggleIssue={handleToggleIssueStatus}
              updatingIssueId={updatingIssueId}
            />

            <IssueListCard
              entries={resolvedIssues.map((issue) => ({
                issue,
                item: items.find((item) => item.id === issue.itemId),
              }))}
              error={issueActionError}
              hasPendingUpdate={Boolean(updatingIssueId)}
              isInitialLoading={isBootstrapLoading}
              issuesCount={resolvedIssues.length}
              onToggleIssue={handleToggleIssueStatus}
              updatingIssueId={updatingIssueId}
            />
          </div>
        </div>
      </main>

      <IssueReportDialog
        items={items}
        onOpenChange={setDialogOpen}
        onSubmitted={({ issue, log }) => {
          handleIssueCreated(issue);
          handleLogCreated(log);
        }}
        open={isDialogOpen}
      />
    </div>
  );
}
