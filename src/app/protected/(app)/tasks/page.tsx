"use client";

import { ChevronRight, Package, User } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/app/header";
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
import { ensureSeed } from "@/lib/mock";
import { ItemRepository } from "@/lib/mock/repositories/items";
import { TaskRepository } from "@/lib/mock/repositories/tasks";
import {
  createEmptyItemStatusCount,
  getItemStatusLabel,
  getTaskStatusBadgeClass,
  getTaskStatusLabel,
  ITEM_STATUS_ORDER,
} from "@/lib/presentation/status";
import { cn } from "@/lib/utils";
import type { Item, ItemStatus, LogEvent, Task, TaskStatus } from "@/types/app";

const TaskCreateDialog = dynamic(
  () =>
    import("@/components/app/task-create-dialog").then((mod) => ({
      default: mod.TaskCreateDialog,
    })),
  {
    ssr: false,
    loading: () => (
      <Button disabled size="sm" type="button">
        タスクを作成
      </Button>
    ),
  },
);

type StatusFilter = TaskStatus | "all";

type TaskRow = {
  task: Task;
  items: Item[];
  statusCounts: Record<ItemStatus, number>;
  quantityTotal: number;
};

type TaskListRowProps = {
  row: TaskRow;
};

// progress bar removed: per-task progress percentage no longer shown

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await ensureSeed();
        const [taskList, itemList] = await Promise.all([
          TaskRepository.list(),
          ItemRepository.list(),
        ]);

        if (!isActive) {
          return;
        }

        setTasks(taskList);
        setItems(itemList);
        setIsLoading(false);
      } catch {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          "タスク情報の読み込みに失敗しました。再読み込みしてください。"
        );
        setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  const handleTaskCreated = useCallback(
    ({
      task,
      items: createdItems,
    }: {
      task: Task;
      items: Item[];
      logs: LogEvent[];
    }) => {
      setTasks((previous) => {
        const next = previous.filter((entity) => entity.id !== task.id);
        return [task, ...next];
      });

      setItems((previous) => {
        const createdIds = new Set(createdItems.map((item) => item.id));
        const remaining = previous.filter((item) => !createdIds.has(item.id));
        return [...createdItems, ...remaining];
      });
    },
    []
  );

  const filteredTasks = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const next: Task[] = [];

    for (const task of tasks) {
      if (statusFilter !== "all" && task.status !== statusFilter) {
        continue;
      }

      if (normalized) {
        const titleMatch = task.title.toLowerCase().includes(normalized);
        const handlerMatch =
          task.handler?.toLowerCase().includes(normalized) ?? false;
        const hasMatch = titleMatch || handlerMatch;
        if (!hasMatch) {
          continue;
        }
      }

      next.push(task);
    }

    return next;
  }, [searchTerm, statusFilter, tasks]);

  const rows = useMemo(() => {
    const itemsByTask = new Map<string, Item[]>();

    for (const item of items) {
      const current = itemsByTask.get(item.taskId);
      if (current) {
        current.push(item);
      } else {
        itemsByTask.set(item.taskId, [item]);
      }
    }

    const result: TaskRow[] = [];

    for (const task of filteredTasks) {
      const taskItems = itemsByTask.get(task.id) ?? [];
      const statusCounts = createEmptyItemStatusCount();
      let quantityTotal = 0;

      for (const item of taskItems) {
        statusCounts[item.status] += 1;
        quantityTotal += item.quantity;
      }

      result.push({
        task,
        items: taskItems,
        statusCounts,
        quantityTotal,
      });
    }

    result.sort((a, b) => {
      if (a.task.createdAt === b.task.createdAt) {
        return 0;
      }

      return a.task.createdAt < b.task.createdAt ? 1 : -1;
    });

    return result;
  }, [filteredTasks, items]);

  const statusFilterOptions = useMemo(
    () => [
      { value: "all" as StatusFilter, label: "すべて" },
      { value: "not_started" as StatusFilter, label: "未着手" },
      { value: "in_progress" as StatusFilter, label: "進行中" },
      { value: "done" as StatusFilter, label: "完了" },
    ],
    []
  );

  const hasTasks = rows.length > 0;
  const isEmptyState = !isLoading && hasTasks === false;
  const listDescription = useMemo(() => {
    if (isLoading) {
      return "読み込み中です...";
    }

    if (hasTasks) {
      return `${rows.length} 件のタスクが見つかりました`;
    }

    return "条件に一致するタスクがありません";
  }, [hasTasks, isLoading, rows]);

  return (
    <>
      <AppHeader
        action={
          <TaskCreateDialog
            onCreated={handleTaskCreated}
            trigger={
              <Button size="sm" type="button">
                タスクを作成
              </Button>
            }
          />
        }
        title="タスク一覧"
      />
      <div className="flex flex-1 flex-col gap-5 px-4 py-4 sm:px-6">
        <Card className="gap-0">
          <CardHeader className="gap-1 pb-3">
            <CardTitle className="text-base">タスクを探す</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label
                className={cn("text-xs", "text-muted-foreground")}
                htmlFor="task-search"
              >
                キーワード検索
              </Label>
              <Input
                autoComplete="off"
                id="task-search"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="タスク名または担当者を入力"
                value={searchTerm}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className={cn("text-xs", "text-muted-foreground")}>
                ステータス
              </p>
              <div className="flex flex-wrap gap-2">
                {statusFilterOptions.map((option) => (
                  <Button
                    aria-pressed={statusFilter === option.value}
                    className="rounded-full px-3 text-xs"
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    size="sm"
                    type="button"
                    variant={
                      statusFilter === option.value ? "default" : "outline"
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            {errorMessage ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                {errorMessage}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex-1 gap-0">
          <CardHeader className="gap-1 pb-3">
            <CardTitle className="text-base">タスク一覧</CardTitle>
            <CardDescription>{listDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-lg bg-muted/60" />
                <div className="h-20 animate-pulse rounded-lg bg-muted/60" />
                <div className="h-20 animate-pulse rounded-lg bg-muted/60" />
              </div>
            ) : null}

            {isEmptyState ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground">
                条件に一致するタスクがありません。検索条件を変更してください。
              </p>
            ) : null}

            {hasTasks ? (
              <ul className="flex flex-col gap-3">
                {rows.map((row) => (
                  <TaskListRow key={row.task.id} row={row} />
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function TaskListRow({ row }: TaskListRowProps) {
  const statusClass = getTaskStatusBadgeClass(row.task.status);
  const itemStatusSummary = ITEM_STATUS_ORDER.map((status) => ({
    status,
    count: row.statusCounts[status],
  })).filter((entry) => entry.count > 0);
  const totalItems = row.items.length;
  const placedCount = row.statusCounts.placed ?? 0;
  const detailHref = `/protected/tasks/${encodeURIComponent(row.task.id)}`;
  const quantityLabel = row.quantityTotal.toLocaleString("ja-JP");

  return (
    <li>
      <Link
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href={detailHref}
      >
        <article
          className={cn(
            "bg-card/70",
            "border",
            "border-border/60",
            "group-focus-visible:border-primary/70",
            "hover:-translate-y-0.5",
            "hover:border-primary/40",
            "hover:shadow-md",
            "p-4",
            "rounded-xl",
            "shadow-sm",
            "transition-all"
          )}
        >
          <div className={cn("flex", "flex-col", "gap-3")}>
            <div className={cn("flex", "gap-2", "items-start")}>
              <h3
                className={cn(
                  "flex-1",
                  "min-w-0",
                  "truncate",
                  "text-base",
                  "font-semibold",
                  "text-foreground"
                )}
                title={row.task.title}
              >
                {row.task.title}
              </h3>
              <Badge
                className={cn("px-2", "shrink-0", "text-xs", statusClass)}
                variant="outline"
              >
                {getTaskStatusLabel(row.task.status)}
              </Badge>
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  "group-focus-visible:translate-x-1",
                  "group-hover:translate-x-1",
                  "h-4",
                  "mt-0.5",
                  "shrink-0",
                  "text-muted-foreground",
                  "transition-transform",
                  "w-4"
                )}
              />
            </div>
            {row.task.description ? (
              <p
                className={cn(
                  "line-clamp-2",
                  "text-muted-foreground",
                  "text-sm"
                )}
              >
                {row.task.description}
              </p>
            ) : null}

            <div
              className={cn(
                "flex",
                "flex-wrap",
                "gap-x-4",
                "gap-y-2",
                "items-center",
                "text-muted-foreground",
                "text-xs"
              )}
            >
              <span className={cn("gap-1.5", "inline-flex", "items-center")}>
                <User aria-hidden="true" className="h-4 w-4" />
                <span>{row.task.handler ?? "担当未設定"}</span>
              </span>
              <span
                className={cn(
                  "gap-1.5",
                  "inline-flex",
                  "items-center",
                  "text-foreground"
                )}
              >
                <Package aria-hidden="true" className="h-4 w-4" />
                <span>{totalItems} 件</span>
              </span>
              <span className={cn("gap-1.5", "inline-flex", "items-center")}>
                <span className="text-muted-foreground">数量</span>
                <span className={cn("font-medium", "text-foreground")}>
                  {quantityLabel}
                </span>
              </span>
            </div>

            {totalItems > 0 ? (
              <p className={cn("text-xs", "text-muted-foreground")}>
                {placedCount} / {totalItems} 件が配置済みです
              </p>
            ) : (
              <p
                className={cn(
                  "gap-2",
                  "inline-flex",
                  "items-center",
                  "text-muted-foreground",
                  "text-xs"
                )}
              >
                まだ物品が登録されていません
              </p>
            )}

            {itemStatusSummary.length > 0 ? (
              <div className={cn("flex", "flex-wrap", "gap-1.5", "pt-1")}>
                {itemStatusSummary.map(({ status, count }) => {
                  const summaryBadgeClass =
                    status === "issue"
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-700"
                      : undefined;

                  return (
                    <Badge
                      className={cn(
                        "text-[11px]",
                        "text-nowrap",
                        summaryBadgeClass
                      )}
                      key={status}
                      variant="secondary"
                    >
                      {getItemStatusLabel(status)} {count}
                    </Badge>
                  );
                })}
              </div>
            ) : null}
          </div>
        </article>
      </Link>
    </li>
  );
}
