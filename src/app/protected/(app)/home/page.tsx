"use client";

import { format, formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/app/header";
import { LogoutButton } from "@/components/logout-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureSeed } from "@/lib/mock";
import { IssueRepository } from "@/lib/mock/repositories/issues";
import { ItemRepository } from "@/lib/mock/repositories/items";
import { LogRepository } from "@/lib/mock/repositories/logs";
import { TaskRepository } from "@/lib/mock/repositories/tasks";
import { describeLog } from "@/lib/presentation/logs";
import {
  createEmptyItemStatusCount,
  getItemStatusLabel,
  getTaskStatusLabel,
} from "@/lib/presentation/status";
import { useAppUiStore } from "@/lib/store/app-store";
import type {
  Issue,
  Item,
  ItemStatus,
  LogEvent,
  Task,
  TaskStatus,
} from "@/types/app";

const RECENT_LOG_LIMIT = 8;
const PERCENT_SCALE = 100;
const ISSUE_PREVIEW_LIMIT = 3;
const TASK_STATUS_ORDER: TaskStatus[] = ["not_started", "in_progress", "done"];

type DashboardLogEntry = {
  id: string;
  actor: string;
  occurredAt: Date;
  title: string;
  description?: string;
  relativeTime: string;
  isNew: boolean;
};

type TaskSummary = {
  total: number;
  statusCount: Map<TaskStatus, number>;
  completionRate: number;
};

type ItemSummary = {
  total: number;
  totalQuantity: number;
  statusCount: Record<ItemStatus, number>;
  completionRate: number;
};

type IssuePreview = {
  id: string;
  summary: string;
  reporter: string;
  occurredAt: Date;
  occurredAtText: string;
};

type DashboardData = {
  tasks: Task[];
  items: Item[];
  issues: Issue[];
  logs: LogEvent[];
  isLoading: boolean;
  errorMessage: string | null;
  lastSeenSnapshot: string | null;
};

function buildTaskSummary(tasks: Task[]): TaskSummary {
  const statusCount = new Map<TaskStatus, number>([
    ["not_started", 0],
    ["in_progress", 0],
    ["done", 0],
  ]);

  for (const task of tasks) {
    const current = statusCount.get(task.status) ?? 0;
    statusCount.set(task.status, current + 1);
  }

  const total = tasks.length;
  const doneCount = statusCount.get("done") ?? 0;
  const completionRate =
    total === 0 ? 0 : Math.round((doneCount / total) * PERCENT_SCALE);

  return {
    total,
    statusCount,
    completionRate,
  };
}

function buildItemSummary(items: Item[]): ItemSummary {
  const statusCount = createEmptyItemStatusCount();
  let totalQuantity = 0;

  for (const item of items) {
    statusCount[item.status] += 1;
    totalQuantity += item.quantity;
  }

  const total = items.length;
  const completionRate =
    total === 0 ? 0 : Math.round((statusCount.placed / total) * PERCENT_SCALE);

  return {
    total,
    totalQuantity,
    statusCount,
    completionRate,
  };
}

function selectOpenIssues(issues: Issue[]): Issue[] {
  return issues.filter((issue) => issue.status === "open");
}

function buildOpenIssuePreview(openIssues: Issue[]): IssuePreview[] {
  return openIssues
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, ISSUE_PREVIEW_LIMIT)
    .map((issue) => {
      const occurredAt = new Date(issue.at);
      return {
        id: issue.id,
        summary: issue.summary,
        reporter: issue.reporter,
        occurredAt,
        occurredAtText: format(occurredAt, "yyyy/MM/dd HH:mm"),
      } satisfies IssuePreview;
    });
}

function buildRecentLogs(
  logs: LogEvent[],
  items: Item[],
  tasks: Task[],
  lastSeenSnapshot: string | null
): DashboardLogEntry[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const lastSeenMillis = lastSeenSnapshot
    ? new Date(lastSeenSnapshot).getTime()
    : null;

  return logs
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((log) => {
      const occurredAt = new Date(log.at);
      const relativeTime = formatDistanceToNowStrict(occurredAt, {
        addSuffix: true,
        locale: ja,
      });
      const { title, description } = describeLog(log, {
        getItemById: (id) => itemsById.get(id),
        getTaskById: (id) => tasksById.get(id),
      });
      const isNew =
        lastSeenMillis === null ? true : occurredAt.getTime() > lastSeenMillis;

      return {
        id: log.id,
        actor: log.actor,
        occurredAt,
        title,
        description,
        relativeTime,
        isNew,
      } satisfies DashboardLogEntry;
    });
}

function useDashboardData(): DashboardData {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setLastSeenLogAt = useAppUiStore((state) => state.setLastSeenLogAt);
  const lastSeenLogAt = useAppUiStore((state) => state.lastSeenLogAt);
  const [lastSeenSnapshot] = useState<string | null>(
    () => lastSeenLogAt ?? null
  );
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await ensureSeed();
        const [taskList, itemList, issueList, logList] = await Promise.all([
          TaskRepository.list(),
          ItemRepository.list(),
          IssueRepository.list(),
          LogRepository.list({ limit: RECENT_LOG_LIMIT }),
        ]);

        if (!active) {
          return;
        }

        setTasks(taskList);
        setItems(itemList);
        setIssues(issueList);
        setLogs(logList);
        setIsLoading(false);
      } catch {
        if (!active) {
          return;
        }

        setErrorMessage("データの読み込みに失敗しました。再度お試しください。");
        setIsLoading(false);
      }
    }

    bootstrap().catch(() => {
      if (active) {
        setErrorMessage("データの読み込みに失敗しました。再度お試しください。");
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || hasMarkedSeen || errorMessage) {
      return;
    }

    setLastSeenLogAt(new Date().toISOString());
    setHasMarkedSeen(true);
  }, [errorMessage, hasMarkedSeen, isLoading, setLastSeenLogAt]);

  return {
    tasks,
    items,
    issues,
    logs,
    isLoading,
    errorMessage,
    lastSeenSnapshot,
  };
}

export default function HomePage() {
  const router = useRouter();
  const {
    tasks,
    items,
    issues,
    logs,
    isLoading,
    errorMessage,
    lastSeenSnapshot,
  } = useDashboardData();

  const taskSummary = useMemo(() => buildTaskSummary(tasks), [tasks]);
  const itemSummary = useMemo(() => buildItemSummary(items), [items]);
  const openIssues = useMemo(() => selectOpenIssues(issues), [issues]);
  const recentLogs = useMemo(
    () => buildRecentLogs(logs, items, tasks, lastSeenSnapshot),
    [items, lastSeenSnapshot, logs, tasks]
  );
  const openIssueList = useMemo(
    () => buildOpenIssuePreview(openIssues),
    [openIssues]
  );
  const remainingOpenIssueCount = Math.max(
    openIssues.length - openIssueList.length,
    0
  );

  let issuesContent: ReactNode;
  if (isLoading) {
    issuesContent = (
      <div className="space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  } else if (openIssues.length === 0) {
    issuesContent = (
      <p className="text-muted-foreground text-sm">
        未対応の問題はありません。
      </p>
    );
  } else {
    issuesContent = (
      <>
        <ul className="space-y-3">
          {openIssueList.map((issue) => (
            <li className="rounded-md border px-3 py-3" key={issue.id}>
              <p className="font-medium text-foreground text-sm">
                {issue.summary}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {issue.reporter}
                <span className="mx-2">·</span>
                {issue.occurredAtText}
              </p>
            </li>
          ))}
        </ul>
        {remainingOpenIssueCount > 0 ? (
          <p className="text-muted-foreground text-xs">
            他 {remainingOpenIssueCount} 件の問題があります。
          </p>
        ) : null}
      </>
    );
  }

  let logsContent: ReactNode;
  if (isLoading) {
    logsContent = (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  } else if (recentLogs.length === 0) {
    logsContent = (
      <p className="text-muted-foreground text-sm">
        表示できるお知らせはまだありません。
      </p>
    );
  } else {
    logsContent = (
      <ul className="space-y-3">
        {recentLogs.map((entry) => (
          <li className="rounded-md border px-3 py-3 text-sm" key={entry.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground text-sm">
                {entry.title}
              </p>
              <span className="text-muted-foreground text-xs">
                {entry.relativeTime}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground text-xs">{entry.actor}</p>
            {entry.description ? (
              <p className="mt-2 text-foreground text-sm">
                {entry.description}
              </p>
            ) : null}
            {entry.isNew ? (
              <Badge className="mt-3" variant="secondary">
                新着
              </Badge>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <AppHeader action={<LogoutButton />} title="ホーム" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>ダッシュボードの読み込みに失敗しました</AlertTitle>
            <AlertDescription>
              <p>{errorMessage}</p>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">進捗サマリー</CardTitle>
            <CardDescription>
              タスク全体と物品の配置状況を集計しています。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : (
              <div className="space-y-6">
                <section aria-label="タスクの進捗">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-muted-foreground text-xs">タスク</p>
                      <p className="mt-1 font-semibold text-2xl">
                        {taskSummary.total}
                        <span className="ml-2 font-normal text-muted-foreground text-sm">
                          完了率 {taskSummary.completionRate}%
                        </span>
                      </p>
                    </div>
                  </header>
                  <Progress
                    aria-label="タスク完了率"
                    className="mt-4"
                    value={taskSummary.completionRate}
                  />
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                    {TASK_STATUS_ORDER.map((status) => (
                      <div key={status}>
                        <dt className="text-muted-foreground text-xs">
                          {getTaskStatusLabel(status)}
                        </dt>
                        <dd className="font-medium text-foreground">
                          {taskSummary.statusCount.get(status) ?? 0}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section aria-label="物品の配置状況">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-muted-foreground text-xs">物品</p>
                      <p className="mt-1 font-semibold text-2xl">
                        {itemSummary.total}
                        <span className="ml-2 font-normal text-muted-foreground text-sm">
                          数量合計 {itemSummary.totalQuantity}
                        </span>
                      </p>
                    </div>
                    <Badge
                      className="border-emerald-500/40 text-emerald-700"
                      variant="outline"
                    >
                      配置率 {itemSummary.completionRate}%
                    </Badge>
                  </header>
                  <Progress
                    aria-label="物品の配置率"
                    className="mt-4"
                    value={itemSummary.completionRate}
                  />
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
                    {Object.entries(itemSummary.statusCount).map(
                      ([status, count]) => (
                        <div key={status}>
                          <dt className="text-muted-foreground text-xs">
                            {getItemStatusLabel(status as ItemStatus)}
                          </dt>
                          <dd className="font-medium text-foreground">
                            {count}
                          </dd>
                        </div>
                      )
                    )}
                  </dl>
                </section>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">未対応の問題</CardTitle>
              <CardDescription>
                報告された破損・紛失などの対応状況を確認できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {issuesContent}

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <div>
                  <p className="font-semibold text-foreground">
                    {openIssues.length}
                    <span className="ml-2 font-normal text-muted-foreground text-sm">
                      件の問題が未対応
                    </span>
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/protected/logs")}
                  size="sm"
                  type="button"
                >
                  ログを開く
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">最新のお知らせ</CardTitle>
              <CardDescription>
                直近の操作履歴や報告が表示されます。
              </CardDescription>
            </CardHeader>
            <CardContent>{logsContent}</CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
