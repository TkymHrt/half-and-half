"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/app/header";
import { TaskCreateDialog } from "@/components/app/task-create-dialog";
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

type StatusFilter = TaskStatus | "all";

type TaskRow = {
  task: Task;
  items: Item[];
  statusCounts: Record<ItemStatus, number>;
  quantityTotal: number;
};

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
                {rows.map((row) => {
                  const statusClass = getTaskStatusBadgeClass(row.task.status);
                  const itemStatusSummary = ITEM_STATUS_ORDER.map((status) => ({
                    status,
                    count: row.statusCounts[status],
                  })).filter((entry) => entry.count > 0);

                  return (
                    <li key={row.task.id}>
                      <Link
                        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        href={`/protected/tasks/${encodeURIComponent(row.task.id)}`}
                      >
                        <article className="rounded-lg border bg-card p-4 shadow-sm transition-colors group-hover:border-primary/60 group-focus-visible:border-primary/70">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3
                              className={cn(
                                "text-base",
                                "font-semibold",
                                "leading-tight",
                                "text-foreground"
                              )}
                            >
                              {row.task.title}
                            </h3>
                            <Badge
                              className={cn("text-xs", statusClass)}
                              variant="outline"
                            >
                              {getTaskStatusLabel(row.task.status)}
                            </Badge>
                          </div>
                          {row.task.description ? (
                            <p
                              className={cn(
                                "mt-1",
                                "line-clamp-2",
                                "text-sm",
                                "text-muted-foreground"
                              )}
                            >
                              {row.task.description}
                            </p>
                          ) : null}
                          <div
                            className={cn(
                              "mt-3",
                              "grid",
                              "gap-3",
                              "text-xs",
                              "text-muted-foreground",
                              "sm:grid-cols-2"
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground/80">
                                担当
                              </span>
                              <span>{row.task.handler ?? "未設定"}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground/80">
                                作成日時
                              </span>
                              <time dateTime={row.task.createdAt}>
                                {formatDate(row.task.createdAt)}
                              </time>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col gap-2">
                            <p className={cn("text-foreground", "text-sm")}>
                              物品 {row.items.length} 件 / 数量{" "}
                              {row.quantityTotal}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {itemStatusSummary.length > 0 ? (
                                itemStatusSummary.map(({ status, count }) => (
                                  <Badge
                                    className="text-nowrap text-[11px]"
                                    key={status}
                                    variant="secondary"
                                  >
                                    {getItemStatusLabel(status)} {count}
                                  </Badge>
                                ))
                              ) : (
                                <span
                                  className={cn(
                                    "text-muted-foreground",
                                    "text-xs"
                                  )}
                                >
                                  内訳なし
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function formatDate(value: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "short",
      timeStyle: "short",
    });
    return formatter.format(new Date(value));
  } catch {
    return value;
  }
}
