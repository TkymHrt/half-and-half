"use client";

import { format, formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/header";
import { IssueReportDialog } from "@/components/app/issue-report-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureSeed } from "@/lib/mock";
import { IssueRepository } from "@/lib/mock/repositories/issues";
import { ItemRepository } from "@/lib/mock/repositories/items";
import { LogRepository } from "@/lib/mock/repositories/logs";
import { TaskRepository } from "@/lib/mock/repositories/tasks";
import { describeLog } from "@/lib/presentation/logs";
import { cn } from "@/lib/utils";
import type { Issue, Item, ItemStatus, LogEvent, Task } from "@/types/app";

const LOG_PAGE_SIZE = 12;
const LOG_ID_RADIX = 36;
const LOG_TYPE_BADGE_CLASS = new Map<LogEvent["type"], string>([
  ["task_created", "bg-blue-500/15 text-blue-700 border-blue-500/30"],
  [
    "task_status_changed",
    "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
  ],
  ["item_added", "bg-sky-500/15 text-sky-700 border-sky-500/30"],
  ["item_status_changed", "bg-amber-400/20 text-amber-700 border-amber-500/40"],
  ["issue_reported", "bg-orange-500/15 text-orange-700 border-orange-500/30"],
  [
    "item_photo_uploaded",
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  ],
  [
    "issue_status_changed",
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  ],
]);

const LOG_TYPE_LABEL = new Map<LogEvent["type"], string>([
  ["task_created", "タスク作成"],
  ["task_status_changed", "タスク更新"],
  ["item_added", "物品追加"],
  ["item_status_changed", "ステータス更新"],
  ["issue_reported", "問題報告"],
  ["issue_status_changed", "問題対応"],
  ["item_photo_uploaded", "写真登録"],
]);

const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  issue: "問題あり",
  moving: "移動中",
  placed: "配置済み",
  unplaced: "未配置",
};

const ISSUE_KIND_LABEL: Record<Issue["kind"], string> = {
  damage: "破損",
  loss: "紛失",
  other: "その他",
};

const ISSUE_KIND_BADGE_CLASS: Record<Issue["kind"], string> = {
  damage: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  loss: "bg-amber-400/20 text-amber-700 border-amber-500/40",
  other: "bg-slate-500/15 text-slate-700 border-slate-500/30",
};

const ISSUE_STATUS_LABEL: Record<Issue["status"], string> = {
  open: "対応中",
  resolved: "解決済み",
};

const ISSUE_STATUS_BADGE_CLASS: Record<Issue["status"], string> = {
  open: "bg-destructive/10 text-destructive border-destructive/40",
  resolved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
};

type LogListEntry = {
  id: string;
  title: string;
  description?: string;
  actor: string;
  occurredAtText: string;
  relativeTime: string;
  type: LogEvent["type"];
  typeLabel: string;
  badgeClass: string;
  item?: Item;
  issueId?: string;
};

type IssueStats = {
  total: number;
  open: number;
  resolved: number;
};

type IssueListEntry = {
  issue: Issue;
  item?: Item;
};

type LogTypeFilter = "all" | LogEvent["type"];

type ResolvedLogQuery = {
  type?: LogEvent["type"];
  keyword?: string;
  startAt?: string;
  endAt?: string;
  startTime?: number;
  endTime?: number;
};

const DATE_INPUT_SEGMENT_COUNT = 3;
const START_OF_DAY_BOUNDARY = Object.freeze({
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
});
const END_OF_DAY_BOUNDARY = Object.freeze({
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
});

type IssueListItemProps = {
  entry: IssueListEntry;
  isUpdating: boolean;
  hasPendingUpdate: boolean;
  onToggle: (issue: Issue) => void;
};

function toIsoDateBoundary(
  value: string,
  mode: "start" | "end"
): string | undefined {
  if (value.length === 0) {
    return;
  }

  const segments = value.split("-");
  if (segments.length !== DATE_INPUT_SEGMENT_COUNT) {
    return;
  }

  const [yearPart, monthPart, dayPart] = segments;
  const year = Number(yearPart);
  if (!Number.isInteger(year)) {
    return;
  }

  const month = Number(monthPart);
  if (!Number.isInteger(month)) {
    return;
  }

  const day = Number(dayPart);
  if (!Number.isInteger(day)) {
    return;
  }

  const boundary =
    mode === "start" ? START_OF_DAY_BOUNDARY : END_OF_DAY_BOUNDARY;

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      boundary.hour,
      boundary.minute,
      boundary.second,
      boundary.millisecond
    )
  );

  if (Number.isNaN(date.getTime())) {
    return;
  }

  if (date.getUTCFullYear() !== year) {
    return;
  }

  if (date.getUTCMonth() + 1 !== month) {
    return;
  }

  if (date.getUTCDate() !== day) {
    return;
  }

  return date.toISOString();
}

function useBootstrapData() {
  const [items, setItems] = useState<Item[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      setIsBootstrapLoading(true);
      setBootstrapError(null);

      try {
        await ensureSeed();
        const [itemList, taskList, issueList] = await Promise.all([
          ItemRepository.list(),
          TaskRepository.list(),
          IssueRepository.list(),
        ]);

        if (!isActive) {
          return;
        }

        setItems(itemList);
        setTasks(taskList);
        setIssues(issueList);
      } catch {
        if (!isActive) {
          return;
        }

        setBootstrapError(
          "データの読み込みに失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        if (isActive) {
          setIsBootstrapLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    items,
    tasks,
    issues,
    setIssues,
    isBootstrapLoading,
    bootstrapError,
  } as const;
}

function doesLogMatchFilters(log: LogEvent, query: ResolvedLogQuery): boolean {
  if (query.type && log.type !== query.type) {
    return false;
  }

  const occurredTime = Date.parse(log.at);
  if (
    query.startTime !== undefined &&
    Number.isFinite(occurredTime) &&
    occurredTime < query.startTime
  ) {
    return false;
  }

  if (
    query.endTime !== undefined &&
    Number.isFinite(occurredTime) &&
    occurredTime > query.endTime
  ) {
    return false;
  }

  if (!query.keyword) {
    return true;
  }

  const candidateTexts = [log.actor, log.id, JSON.stringify(log.payload)];
  for (const text of candidateTexts) {
    if (text.length === 0) {
      continue;
    }

    if (text.toLowerCase().includes(query.keyword)) {
      return true;
    }
  }

  return false;
}

function useLogFeed(query: ResolvedLogQuery) {
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

function useLogFilters() {
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

function useIssueData(issues: Issue[], itemsById: Map<string, Item>) {
  const issueStats = useMemo(() => buildIssueStats(issues), [issues]);

  const issueEntries = useMemo<IssueListEntry[]>(() => {
    if (issues.length === 0) {
      return [];
    }

    return issues
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "open" ? -1 : 1;
        }
        return a.at < b.at ? 1 : -1;
      })
      .map((issue) => ({
        issue,
        item: issue.itemId ? itemsById.get(issue.itemId) : undefined,
      }));
  }, [issues, itemsById]);

  return { issueStats, issueEntries } as const;
}

function useLogEntries(
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

function useIssueActions(
  appendLog: (log: LogEvent) => void,
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>
) {
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
  const [issueActionError, setIssueActionError] = useState<string | null>(null);

  const handleToggleIssueStatus = useCallback(
    async (issue: Issue) => {
      if (updatingIssueId && updatingIssueId !== issue.id) {
        return;
      }

      const nextStatus = issue.status === "open" ? "resolved" : "open";
      setUpdatingIssueId(issue.id);
      setIssueActionError(null);

      try {
        const updated = await IssueRepository.update(issue.id, {
          status: nextStatus,
        });

        if (!updated) {
          throw new Error("ISSUE_UPDATE_FAILED");
        }

        setIssues((prev) =>
          prev.map((entity) => (entity.id === updated.id ? updated : entity))
        );

        const logEvent: LogEvent = {
          id: `log-${Date.now().toString(LOG_ID_RADIX)}`,
          at: new Date().toISOString(),
          actor: "運営本部",
          type: "issue_status_changed",
          payload: {
            issueId: updated.id,
            itemId: updated.itemId,
            status: updated.status,
            summary: updated.summary,
            previousStatus: issue.status,
          },
        } satisfies LogEvent;

        await LogRepository.add(logEvent);
        appendLog(logEvent);

        toast.success(
          nextStatus === "resolved"
            ? "問題を解決済みとして記録しました"
            : "問題を対応中に戻しました"
        );
      } catch {
        setIssueActionError(
          "問題のステータス更新に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setUpdatingIssueId(null);
      }
    },
    [appendLog, setIssues, updatingIssueId]
  );

  return {
    updatingIssueId,
    issueActionError,
    handleToggleIssueStatus,
  } as const;
}

function useInfiniteScroll(
  targetRef: React.RefObject<Element | null>,
  options: { enabled: boolean; onLoadMore: () => void }
) {
  const { enabled, onLoadMore } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const target = targetRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "160px" }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, onLoadMore, targetRef]);
}

function IssueListItem({
  entry,
  isUpdating,
  hasPendingUpdate,
  onToggle,
}: IssueListItemProps) {
  const { issue, item } = entry;
  const actionLabel =
    issue.status === "open" ? "解決済みにする" : "対応中に戻す";
  const disableButton = (hasPendingUpdate && !isUpdating) || isUpdating;

  return (
    <li>
      <article className="rounded-lg border bg-card px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-foreground text-sm">
                {issue.summary}
              </h3>
              <Badge
                className={cn("text-xs", ISSUE_KIND_BADGE_CLASS[issue.kind])}
                variant="outline"
              >
                {ISSUE_KIND_LABEL[issue.kind]}
              </Badge>
            </div>
            <p className="text-muted-foreground/90 text-xs">
              {issue.reporter} / {formatIssueDate(issue.at)}
            </p>
            {item ? (
              <p className="text-muted-foreground/90 text-xs">
                対象物品: {item.name}
                <span className="block">移動先: {item.targetName}</span>
              </p>
            ) : null}
            {issue.detail ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {issue.detail}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              className={cn("text-xs", ISSUE_STATUS_BADGE_CLASS[issue.status])}
              variant="outline"
            >
              {ISSUE_STATUS_LABEL[issue.status]}
            </Badge>
            <Button
              disabled={disableButton}
              onClick={() => onToggle(issue)}
              size="sm"
              type="button"
              variant={issue.status === "open" ? "secondary" : "ghost"}
            >
              {isUpdating ? "更新中..." : actionLabel}
            </Button>
          </div>
        </div>
      </article>
    </li>
  );
}

type IssueSummaryCardProps = {
  stats: IssueStats;
};

function IssueSummaryCard({ stats }: IssueSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">問題の状況</CardTitle>
        <CardDescription>
          未対応の問題件数と対応済み件数のサマリーです。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card px-3 py-3">
            <dt className="text-muted-foreground text-xs">総件数</dt>
            <dd className="mt-1 font-semibold text-2xl text-foreground">
              {stats.total}
            </dd>
            <p className="mt-2 text-muted-foreground/90 text-xs">
              登録済みの問題レポート件数
            </p>
          </div>
          <div className="rounded-lg border bg-card px-3 py-3">
            <dt className="text-muted-foreground text-xs">対応中</dt>
            <dd className="mt-1 font-semibold text-2xl text-destructive">
              {stats.open}
            </dd>
            <p className="mt-2 text-muted-foreground/90 text-xs">
              対応が必要な問題
            </p>
          </div>
          <div className="rounded-lg border bg-card px-3 py-3">
            <dt className="text-muted-foreground text-xs">解決済み</dt>
            <dd className="mt-1 font-semibold text-2xl text-emerald-600">
              {stats.resolved}
            </dd>
            <p className="mt-2 text-muted-foreground/90 text-xs">
              対応完了として記録された件数
            </p>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

type IssueListCardProps = {
  entries: IssueListEntry[];
  isInitialLoading: boolean;
  issuesCount: number;
  updatingIssueId: string | null;
  hasPendingUpdate: boolean;
  error: string | null;
  onToggleIssue: (issue: Issue) => void;
};

function IssueListCard({
  entries,
  isInitialLoading,
  issuesCount,
  updatingIssueId,
  hasPendingUpdate,
  error,
  onToggleIssue,
}: IssueListCardProps) {
  const showSkeleton = isInitialLoading && issuesCount === 0;
  const showEmpty = !isInitialLoading && entries.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">問題一覧</CardTitle>
        <CardDescription>
          発生している問題を確認し、ステータスを更新できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="mb-3 text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {showSkeleton ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : null}

        {showEmpty ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground">
            現在登録されている問題はありません。
          </p>
        ) : null}

        {entries.length > 0 ? (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <IssueListItem
                entry={entry}
                hasPendingUpdate={hasPendingUpdate}
                isUpdating={updatingIssueId === entry.issue.id}
                key={entry.issue.id}
                onToggle={onToggleIssue}
              />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

type LogFiltersFormProps = {
  keyword: string;
  startDate: string;
  endDate: string;
  logType: LogTypeFilter;
  hasActiveFilters: boolean;
  disabled: boolean;
  onKeywordChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onLogTypeChange: (value: LogTypeFilter) => void;
  onClear: () => void;
};

function LogFiltersForm({
  keyword,
  startDate,
  endDate,
  logType,
  hasActiveFilters,
  disabled,
  onKeywordChange,
  onStartDateChange,
  onEndDateChange,
  onLogTypeChange,
  onClear,
}: LogFiltersFormProps) {
  return (
    <form
      className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-1.5">
        <Label
          className="text-muted-foreground text-xs"
          htmlFor="log-search-input"
        >
          キーワード
        </Label>
        <Input
          autoComplete="off"
          id="log-search-input"
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="担当者・物品名・概要で検索"
          value={keyword}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="text-muted-foreground text-xs"
          htmlFor="log-start-date"
        >
          開始日
        </Label>
        <Input
          id="log-start-date"
          max={endDate || undefined}
          onChange={(event) => onStartDateChange(event.target.value)}
          type="date"
          value={startDate}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs" htmlFor="log-end-date">
          終了日
        </Label>
        <Input
          id="log-end-date"
          min={startDate || undefined}
          onChange={(event) => onEndDateChange(event.target.value)}
          type="date"
          value={endDate}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="text-muted-foreground text-xs"
          htmlFor="log-type-filter"
        >
          種別
        </Label>
        <Select
          onValueChange={(value) => {
            onLogTypeChange(value as LogTypeFilter);
          }}
          value={logType}
        >
          <SelectTrigger id="log-type-filter">
            <SelectValue placeholder="種類を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="task_created">タスク作成</SelectItem>
            <SelectItem value="item_added">物品追加</SelectItem>
            <SelectItem value="item_status_changed">ステータス更新</SelectItem>
            <SelectItem value="issue_reported">問題報告</SelectItem>
            <SelectItem value="issue_status_changed">問題対応</SelectItem>
            <SelectItem value="item_photo_uploaded">写真登録</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button
          disabled={!hasActiveFilters || disabled}
          onClick={onClear}
          type="button"
          variant="ghost"
        >
          条件をクリア
        </Button>
      </div>
    </form>
  );
}

type LogListCardProps = {
  filters: LogFiltersFormProps;
  entries: LogListEntry[];
  initialError: string | null;
  isInitialLoading: boolean;
  isEmptyState: boolean;
  loadMoreError: string | null;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
};

function LogListCard({
  filters,
  entries,
  initialError,
  isInitialLoading,
  isEmptyState,
  loadMoreError,
  isLoadingMore,
  hasMore,
  loadMoreRef,
}: LogListCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">活動ログ</CardTitle>
        <CardDescription>
          最新の活動や問題報告を時系列で表示します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LogFiltersForm {...filters} />

        {initialError ? (
          <p className="text-destructive text-sm" role="alert">
            {initialError}
          </p>
        ) : null}

        {isInitialLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : null}

        {isEmptyState ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground">
            {filters.hasActiveFilters
              ? "条件に一致するログがありません。検索条件を調整してください。"
              : "まだ表示できるログがありません。操作を行うとここに履歴が記録されます。"}
          </p>
        ) : null}

        {entries.length > 0 ? (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <article className="rounded-lg border bg-card px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-base text-foreground">
                        {entry.title}
                      </h3>
                      {entry.description ? (
                        <p className="mt-1 text-muted-foreground text-sm">
                          {entry.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-muted-foreground/90 text-xs">
                        {entry.actor} / {entry.occurredAtText}（
                        {entry.relativeTime}）
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs",
                        LOG_TYPE_BADGE_CLASS.get(entry.type) ?? ""
                      )}
                      variant="outline"
                    >
                      {entry.typeLabel}
                    </Badge>
                  </div>

                  {entry.item ? (
                    <div className="mt-4 rounded-md bg-muted/40 px-3 py-3 text-muted-foreground/90 text-xs">
                      <p className="font-medium text-foreground text-sm">
                        対象物品: {entry.item.name}
                      </p>
                      <p className="mt-1 leading-relaxed">
                        借用元: {entry.item.sourceName}
                        <br />
                        移動先: {entry.item.targetName}
                        <br />
                        ステータス: {ITEM_STATUS_LABEL[entry.item.status]}
                      </p>
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        ) : null}

        {loadMoreError ? (
          <p className="mt-4 text-center text-destructive text-sm" role="alert">
            {loadMoreError}
          </p>
        ) : null}

        {hasMore ? (
          <div
            aria-hidden="true"
            className="mt-4 h-4 w-full"
            ref={loadMoreRef}
          />
        ) : null}

        {isLoadingMore ? (
          <div className="mt-4 flex items-center justify-center">
            <Skeleton className="h-4 w-4 rounded-full" />
            <span className="ml-2 text-muted-foreground text-xs">
              読み込み中...
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatIssueDate(value: string): string {
  try {
    return format(new Date(value), "yyyy/MM/dd HH:mm");
  } catch {
    return value;
  }
}

function buildIssueStats(source: Issue[]): IssueStats {
  let open = 0;
  let resolved = 0;
  for (const issue of source) {
    if (issue.status === "open") {
      open += 1;
    } else {
      resolved += 1;
    }
  }
  return {
    total: source.length,
    open,
    resolved,
  } satisfies IssueStats;
}

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
