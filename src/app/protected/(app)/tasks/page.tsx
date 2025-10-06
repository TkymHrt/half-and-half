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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function getTaskStatusCount(
  source: Map<TaskStatus, number>,
  status: TaskStatus
): number {
  return source.get(status) ?? 0;
}

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

  const summary = useMemo(() => {
    const taskStatusCount = new Map<TaskStatus, number>([
      ["done", 0],
      ["in_progress", 0],
      ["not_started", 0],
    ]);

    for (const task of tasks) {
      const current = taskStatusCount.get(task.status) ?? 0;
      taskStatusCount.set(task.status, current + 1);
    }

    const itemStatusCount = createEmptyItemStatusCount();
    let itemQuantityTotal = 0;

    for (const item of items) {
      itemStatusCount[item.status] += 1;
      itemQuantityTotal += item.quantity;
    }

    return {
      totalTasks: tasks.length,
      taskStatusCount,
      totalItems: items.length,
      itemStatusCount,
      itemQuantityTotal,
    };
  }, [items, tasks]);

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
        description="タスクと物品を管理します"
        title="タスク一覧"
      />
      <div className="flex flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">全体サマリー</CardTitle>
            <CardDescription>
              タスクと物品の状況をステータスごとに集計しています。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card px-3 py-3">
                <dt className="text-muted-foreground text-xs">
                  登録済みタスク
                </dt>
                <dd
                  className={cn(
                    "mt-1",
                    "font-semibold",
                    "text-2xl",
                    "text-foreground"
                  )}
                >
                  {summary.totalTasks}
                </dd>
                <p
                  className={cn("mt-2", "text-xs", "text-muted-foreground/90")}
                >
                  未着手{" "}
                  {getTaskStatusCount(summary.taskStatusCount, "not_started")} /
                  進行中{" "}
                  {getTaskStatusCount(summary.taskStatusCount, "in_progress")} /
                  完了 {getTaskStatusCount(summary.taskStatusCount, "done")}
                </p>
              </div>
              <div className="rounded-lg border bg-card px-3 py-3">
                <dt className="text-muted-foreground text-xs">物品の総数</dt>
                <dd
                  className={cn(
                    "mt-1",
                    "font-semibold",
                    "text-2xl",
                    "text-foreground"
                  )}
                >
                  {summary.totalItems}
                </dd>
                <p
                  className={cn("mt-2", "text-xs", "text-muted-foreground/90")}
                >
                  合計数量 {summary.itemQuantityTotal}
                </p>
              </div>
              <div className="rounded-lg border bg-card px-3 py-3">
                <dt className="text-muted-foreground text-xs">配置済み</dt>
                <dd
                  className={cn(
                    "mt-1",
                    "font-semibold",
                    "text-2xl",
                    "text-foreground"
                  )}
                >
                  {summary.itemStatusCount.placed}
                </dd>
                <p
                  className={cn("mt-2", "text-xs", "text-muted-foreground/90")}
                >
                  完了した物品の数
                </p>
              </div>
              <div className="rounded-lg border bg-card px-3 py-3">
                <dt className="text-muted-foreground text-xs">対応が必要</dt>
                <dd
                  className={cn(
                    "mt-1",
                    "font-semibold",
                    "text-2xl",
                    "text-destructive"
                  )}
                >
                  {summary.itemStatusCount.issue}
                </dd>
                <p
                  className={cn("mt-2", "text-xs", "text-muted-foreground/90")}
                >
                  問題報告が紐づいている物品
                </p>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">タスクを探す</CardTitle>
            <CardDescription>
              タイトルや担当者、ステータスで絞り込みができます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[1fr_minmax(0,220px)]">
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
                <Label
                  className={cn("text-xs", "text-muted-foreground")}
                  htmlFor="task-status-filter"
                >
                  ステータス
                </Label>
                <Select
                  onValueChange={(value) => {
                    setStatusFilter((value || "all") as StatusFilter);
                  }}
                  value={statusFilter}
                >
                  <SelectTrigger id="task-status-filter">
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="not_started">未着手</SelectItem>
                    <SelectItem value="in_progress">進行中</SelectItem>
                    <SelectItem value="done">完了</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errorMessage ? (
              <p className="mt-3 text-destructive text-sm">{errorMessage}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">タスク一覧</CardTitle>
            <CardDescription>{listDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded-md bg-muted/60" />
                <div className="h-16 animate-pulse rounded-md bg-muted/60" />
                <div className="h-16 animate-pulse rounded-md bg-muted/60" />
              </div>
            ) : null}

            {isEmptyState ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground">
                条件に一致するタスクがありません。検索条件を変更してください。
              </p>
            ) : null}

            {hasTasks ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">タスク</TableHead>
                    <TableHead scope="col">担当</TableHead>
                    <TableHead scope="col">物品</TableHead>
                    <TableHead scope="col">ステータス</TableHead>
                    <TableHead scope="col">作成日時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const statusClass = getTaskStatusBadgeClass(
                      row.task.status
                    );
                    const itemSummaryParts: string[] = [];

                    for (const status of ITEM_STATUS_ORDER) {
                      const count = row.statusCounts[status];
                      if (count > 0) {
                        itemSummaryParts.push(
                          `${getItemStatusLabel(status)} ${count}`
                        );
                      }
                    }

                    const itemSummary = itemSummaryParts.join(" / ");

                    return (
                      <TableRow className="align-top" key={row.task.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Link
                              className="font-semibold text-foreground hover:underline"
                              href={`/protected/tasks/${encodeURIComponent(row.task.id)}`}
                            >
                              {row.task.title}
                            </Link>
                            {row.task.description ? (
                              <p
                                className={cn(
                                  "line-clamp-2",
                                  "text-xs",
                                  "text-muted-foreground/90"
                                )}
                              >
                                {row.task.description}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.task.handler ?? "未設定"}
                        </TableCell>
                        <TableCell>
                          <div className={cn("text-foreground", "text-sm")}>
                            <div className="font-medium">
                              物品 {row.items.length} 件 / 数量{" "}
                              {row.quantityTotal}
                            </div>
                            <p
                              className={cn(
                                "text-xs",
                                "text-muted-foreground/90"
                              )}
                            >
                              {itemSummary || "内訳なし"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn("text-xs", statusClass)}
                            variant="outline"
                          >
                            {getTaskStatusLabel(row.task.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDate(row.task.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
