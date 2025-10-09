"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app/header";
import { ItemDetailDrawer } from "@/components/app/item-detail-drawer";
import { ItemStatusSelect } from "@/components/app/item-status-select";
import { TaskEditDialog } from "@/components/app/task-edit-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  deleteTaskWithLog,
  updateItemStatusWithLog,
  updateTaskStatusWithLog,
} from "@/lib/application/activity";
import { ensureSeed } from "@/lib/mock";
import { ItemRepository } from "@/lib/mock/repositories/items";
import { TaskRepository } from "@/lib/mock/repositories/tasks";
import {
  createMapHref,
  ITEM_STATUS_BADGE_CLASS,
} from "@/lib/presentation/items";
import {
  createEmptyItemStatusCount,
  getItemStatusLabel,
  getTaskStatusBadgeClass,
  getTaskStatusLabel,
  ITEM_STATUS_ORDER,
} from "@/lib/presentation/status";
import { cn } from "@/lib/utils";
import type { Item, ItemStatus, Task, TaskStatus } from "@/types/app";

type TaskDetailPageProps = {
  params: { taskId: string };
};

type ItemWithOrder = Item & { order: number };

function orderItemsByStatus(items: Item[]): ItemWithOrder[] {
  const statusIndex = new Map<ItemStatus, number>(
    ITEM_STATUS_ORDER.map((status, index) => [status, index])
  );

  return [...items]
    .map<ItemWithOrder>((item) => ({
      ...item,
      order: statusIndex.get(item.status) ?? ITEM_STATUS_ORDER.length,
    }))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      return a.name.localeCompare(b.name, "ja");
    });
}

function summarizeItems(items: Item[]) {
  const counts = createEmptyItemStatusCount();
  let quantityTotal = 0;

  for (const item of items) {
    counts[item.status] += 1;
    quantityTotal += item.quantity;
  }

  return {
    counts,
    quantityTotal,
  } as const;
}

function useTaskDetailData(taskId: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTaskDetail() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await ensureSeed();
        const [taskEntity, itemList] = await Promise.all([
          TaskRepository.get(taskId),
          ItemRepository.list({ taskId }),
        ]);

        if (!isMounted) {
          return;
        }

        setTask(taskEntity);
        setItems(itemList);
      } catch {
        if (!isMounted) {
          return;
        }
        setErrorMessage(
          "タスク情報の読み込みに失敗しました。再読み込みしてください。"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTaskDetail();

    return () => {
      isMounted = false;
    };
  }, [taskId]);

  return {
    task,
    setTask,
    items,
    setItems,
    isLoading,
    errorMessage,
  } as const;
}

function useItemStatusManager(params: {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  task: Task | null;
  setTask: React.Dispatch<React.SetStateAction<Task | null>>;
  taskId: string;
}) {
  const { items, setItems, task, setTask, taskId } = params;
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleItemStatusChange = useCallback(
    async (item: Item, nextStatus: ItemStatus) => {
      if (updatingItemId || item.status === nextStatus) {
        return;
      }

      setUpdatingItemId(item.id);
      setActionError(null);

      try {
        const {
          items: nextItems,
          task: updatedTask,
          taskStatus,
        } = await updateItemStatusWithLog({
          item,
          nextStatus,
          items,
          taskId,
          actor: task?.handler,
        });

        setItems(nextItems);

        if (updatedTask) {
          setTask(updatedTask);
        } else if (task) {
          setTask({ ...task, status: taskStatus });
        }

        toast.success(
          `「${item.name}」を${getItemStatusLabel(nextStatus)}に更新しました`
        );
      } catch {
        setActionError(
          "ステータスの更新に失敗しました。時間をおいて再度お試しください。"
        );
        toast.error("ステータスの更新に失敗しました");
      } finally {
        setUpdatingItemId(null);
      }
    },
    [items, setItems, setTask, task, taskId, updatingItemId]
  );

  const handleItemUpdatedFromDrawer = useCallback(
    (updated: Item) => {
      setItems((previous) =>
        previous.map((entry) => (entry.id === updated.id ? updated : entry))
      );
    },
    [setItems]
  );

  return {
    updatingItemId,
    actionError,
    handleItemStatusChange,
    handleItemUpdatedFromDrawer,
  } as const;
}

function useTaskStatusManager(
  task: Task | null,
  setTask: React.Dispatch<React.SetStateAction<Task | null>>
) {
  const [isTaskStatusUpdating, setTaskStatusUpdating] = useState(false);
  const [taskStatusError, setTaskStatusError] = useState<string | null>(null);

  const handleTaskStatusChange = useCallback(
    async (nextStatus: TaskStatus) => {
      if (!task || task.status === nextStatus) {
        return;
      }

      setTaskStatusUpdating(true);
      setTaskStatusError(null);

      try {
        const { task: updatedTask } = await updateTaskStatusWithLog({
          task,
          nextStatus,
          actor: task.handler,
        });

        setTask(updatedTask);
        toast.success(
          `タスクを${getTaskStatusLabel(nextStatus)}に更新しました`
        );
      } catch {
        setTaskStatusError(
          "タスクのステータス更新に失敗しました。時間をおいて再度お試しください。"
        );
        toast.error("タスクのステータス更新に失敗しました");
      } finally {
        setTaskStatusUpdating(false);
      }
    },
    [setTask, task]
  );

  return {
    isTaskStatusUpdating,
    taskStatusError,
    handleTaskStatusChange,
  } as const;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const taskId = decodeURIComponent(params.taskId);
  const { task, setTask, items, setItems, isLoading, errorMessage } =
    useTaskDetailData(taskId);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const taskStatusSelectId = useId();
  const {
    updatingItemId,
    actionError,
    handleItemStatusChange,
    handleItemUpdatedFromDrawer,
  } = useItemStatusManager({
    items,
    setItems,
    task,
    setTask,
    taskId,
  });
  const { isTaskStatusUpdating, taskStatusError, handleTaskStatusChange } =
    useTaskStatusManager(task, setTask);

  const orderedItems = useMemo(() => orderItemsByStatus(items), [items]);
  const itemSummary = useMemo(() => summarizeItems(items), [items]);
  const itemStatusCount = itemSummary.counts;
  const itemQuantityTotal = itemSummary.quantityTotal;
  const selectedItem = useMemo(
    () =>
      selectedItemId
        ? (items.find((entity) => entity.id === selectedItemId) ?? null)
        : null,
    [items, selectedItemId]
  );
  const createdAtLabel = useMemo(() => {
    if (!task) {
      return null;
    }
    return formatDate(task.createdAt);
  }, [task]);
  const handlerLabel = task?.handler ?? "未設定";
  const showNotFound = useMemo(
    () => !isLoading && errorMessage === null && task === null,
    [errorMessage, isLoading, task]
  );

  const handleOpenDetail = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setDetailOpen(true);
  }, []);

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedItemId(null);
    }
  }, []);

  const handleTaskUpdated = useCallback(
    (context: { task: Task; items: Item[] }) => {
      setTask(context.task);
      setItems(context.items);
      toast.success("タスクを更新しました");
    },
    [setItems, setTask]
  );

  const handleDeleteTask = useCallback(async () => {
    if (!task) {
      return;
    }

    setDeleting(true);

    try {
      await deleteTaskWithLog({ task, actor: task.handler });
      toast.success("タスクを削除しました");
      window.location.href = "/protected/tasks";
    } catch {
      toast.error("タスクの削除に失敗しました");
      setDeleting(false);
    }
  }, [task]);

  const handleItemDeleted = useCallback(
    (itemId: string) => {
      setItems((previous) => previous.filter((item) => item.id !== itemId));
      setSelectedItemId(null);
      setDetailOpen(false);
    },
    [setItems]
  );

  return (
    <>
      <AppHeader
        secondaryAction={
          <Button asChild size="sm" type="button" variant="outline">
            <Link href="/protected/tasks">一覧に戻る</Link>
          </Button>
        }
        title={"タスク詳細"}
      />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        {isLoading ? <LoadingState /> : null}

        {errorMessage ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            {errorMessage}
          </p>
        ) : null}

        {showNotFound ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                タスクが見つかりません
              </CardTitle>
              <CardDescription>
                指定されたタスク ID "{taskId}"
                に対応するデータは存在しません。タスク一覧から再度選択してください。
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {task ? (
          <>
            <TaskSummaryCard
              createdAtLabel={createdAtLabel}
              handlerLabel={handlerLabel}
              isStatusUpdating={isTaskStatusUpdating}
              onOpenDelete={() => setDeleteDialogOpen(true)}
              onOpenEdit={() => setEditDialogOpen(true)}
              onStatusChange={handleTaskStatusChange}
              statusError={taskStatusError}
              statusSelectId={taskStatusSelectId}
              task={task}
            />
            <TaskItemsCard
              actionError={actionError}
              itemQuantityTotal={itemQuantityTotal}
              itemStatusCount={itemStatusCount}
              items={orderedItems}
              onItemStatusChange={handleItemStatusChange}
              onShowDetail={handleOpenDetail}
              updatingItemId={updatingItemId}
            />
          </>
        ) : null}
      </div>
      <ItemDetailDrawer
        actor={task?.handler}
        isStatusUpdating={updatingItemId !== null}
        item={selectedItem}
        items={items}
        onChangeStatus={handleItemStatusChange}
        onItemDeleted={handleItemDeleted}
        onItemUpdated={handleItemUpdatedFromDrawer}
        onOpenChange={handleDrawerOpenChange}
        open={Boolean(selectedItem) && isDetailOpen}
        taskId={taskId}
      />
      {task ? (
        <>
          <TaskEditDialog
            items={items}
            onOpenChange={setEditDialogOpen}
            onUpdated={handleTaskUpdated}
            open={isEditDialogOpen}
            task={task}
          />
          <AlertDialog
            onOpenChange={setDeleteDialogOpen}
            open={isDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>タスクを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  このタスクと関連する全ての物品情報が完全に削除されます。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  キャンセル
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={isDeleting}
                  onClick={handleDeleteTask}
                >
                  {isDeleting ? "削除中..." : "削除"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </>
  );
}

type TaskSummaryCardProps = {
  task: Task;
  handlerLabel: string;
  createdAtLabel: string | null;
  statusSelectId: string;
  isStatusUpdating: boolean;
  statusError: string | null;
  onStatusChange: (status: TaskStatus) => void;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
};

function TaskSummaryCard({
  task,
  handlerLabel,
  statusSelectId,
  isStatusUpdating,
  statusError,
  onStatusChange,
  onOpenEdit,
  onOpenDelete,
}: TaskSummaryCardProps) {
  const statusBadgeClass = getTaskStatusBadgeClass(task.status);

  return (
    <Card className="gap-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{task.title}</CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={onOpenEdit}
            size="sm"
            type="button"
            variant="outline"
          >
            編集
          </Button>
          <Button
            onClick={onOpenDelete}
            size="sm"
            type="button"
            variant="destructive"
          >
            削除
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-3 rounded-lg">
          <Badge className={cn("text-xs", statusBadgeClass)} variant="outline">
            {getTaskStatusLabel(task.status)}
          </Badge>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-background/70 p-3 shadow-sm">
              <p
                className={cn(
                  "font-medium",
                  "text-[11px]",
                  "text-muted-foreground/80",
                  "tracking-wide",
                  "uppercase"
                )}
              >
                担当
              </p>
              <p
                className={cn(
                  "mt-1",
                  "text-foreground",
                  "text-sm",
                  "font-semibold"
                )}
              >
                {handlerLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <Label
            className={cn("text-muted-foreground", "text-xs", "font-medium")}
            htmlFor={statusSelectId}
          >
            ステータスを変更
          </Label>
          <Select
            disabled={isStatusUpdating}
            onValueChange={(value) => onStatusChange(value as TaskStatus)}
            value={task.status}
          >
            <SelectTrigger
              className="w-full sm:max-w-[260px]"
              id={statusSelectId}
            >
              <SelectValue placeholder="ステータスを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">未着手</SelectItem>
              <SelectItem value="in_progress">進行中</SelectItem>
              <SelectItem value="done">完了</SelectItem>
            </SelectContent>
          </Select>
          {isStatusUpdating ? (
            <span className={cn("text-muted-foreground", "text-xs")}>
              更新中...
            </span>
          ) : null}
          {statusError ? (
            <p className={cn("text-destructive", "text-xs")} role="alert">
              {statusError}
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className={cn("text-foreground", "text-sm", "font-semibold")}>
            概要
          </h3>
          <p
            className={cn(
              "leading-relaxed",
              "text-muted-foreground",
              "text-sm"
            )}
          >
            {task.description ?? "説明は設定されていません。"}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}

type TaskItemsCardProps = {
  items: ItemWithOrder[];
  itemQuantityTotal: number;
  itemStatusCount: Record<ItemStatus, number>;
  updatingItemId: string | null;
  actionError: string | null;
  onItemStatusChange: (item: Item, status: ItemStatus) => void;
  onShowDetail: (itemId: string) => void;
};

function TaskItemsCard({
  items,
  itemQuantityTotal,
  itemStatusCount,
  updatingItemId,
  actionError,
  onItemStatusChange,
  onShowDetail,
}: TaskItemsCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">関連する物品</CardTitle>
        <CardDescription>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground text-sm">
              物品数: {items.length} 件 / 合計数量: {itemQuantityTotal}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                className={cn("text-xs", ITEM_STATUS_BADGE_CLASS.unplaced)}
                variant="outline"
              >
                未配置
                <span className="ml-1 font-semibold">
                  {itemStatusCount.unplaced}
                </span>
              </Badge>
              <Badge
                className={cn("text-xs", ITEM_STATUS_BADGE_CLASS.moving)}
                variant="outline"
              >
                移動中
                <span className="ml-1 font-semibold">
                  {itemStatusCount.moving}
                </span>
              </Badge>
              <Badge
                className={cn("text-xs", ITEM_STATUS_BADGE_CLASS.placed)}
                variant="outline"
              >
                配置済み
                <span className="ml-1 font-semibold">
                  {itemStatusCount.placed}
                </span>
              </Badge>
              <Badge
                className={cn("text-xs", ITEM_STATUS_BADGE_CLASS.issue)}
                variant="outline"
              >
                問題あり
                <span className="ml-1 font-semibold">
                  {itemStatusCount.issue}
                </span>
              </Badge>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground">
            このタスクに紐づく物品は登録されていません。
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">物品</TableHead>
                <TableHead scope="col">所在地</TableHead>
                <TableHead scope="col">担当</TableHead>
                <TableHead scope="col">ステータス</TableHead>
                <TableHead scope="col">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((rowItem) => (
                <TaskItemRow
                  isBusy={updatingItemId !== null}
                  item={rowItem}
                  key={rowItem.id}
                  onShowDetail={onShowDetail}
                  onStatusChange={onItemStatusChange}
                  updatingItemId={updatingItemId}
                />
              ))}
            </TableBody>
          </Table>
        )}
        {actionError ? (
          <p className="mt-3 text-destructive text-sm" role="alert">
            {actionError}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-lg bg-muted/60" />
      <div className="h-60 animate-pulse rounded-lg bg-muted/60" />
    </div>
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

type TaskItemRowProps = {
  item: Item;
  isBusy: boolean;
  updatingItemId: string | null;
  onStatusChange: (item: Item, status: ItemStatus) => void;
  onShowDetail: (itemId: string) => void;
};

function TaskItemRow({
  item,
  isBusy,
  updatingItemId,
  onStatusChange,
  onShowDetail,
}: TaskItemRowProps) {
  const statusBadge = ITEM_STATUS_BADGE_CLASS[item.status];
  const isUpdating = updatingItemId === item.id;
  const sourceHref = createMapHref(item, "source");
  const targetHref = createMapHref(item, "target");
  const sourceContent = sourceHref ? (
    <Link
      aria-label={`${item.sourceName} をマップで表示`}
      className="text-primary text-sm underline-offset-4 hover:underline"
      href={sourceHref}
    >
      {item.sourceName}
    </Link>
  ) : (
    <span className="text-foreground text-sm">{item.sourceName}</span>
  );
  const targetContent = targetHref ? (
    <Link
      aria-label={`${item.targetName} をマップで表示`}
      className="text-primary text-sm underline-offset-4 hover:underline"
      href={targetHref}
    >
      {item.targetName}
    </Link>
  ) : (
    <span className="text-foreground text-sm">{item.targetName}</span>
  );

  return (
    <TableRow className="align-top">
      <TableCell>
        <div className="font-medium text-foreground">{item.name}</div>
        <p className="text-muted-foreground text-xs">数量 {item.quantity}</p>
      </TableCell>
      <TableCell>
        <p className="text-muted-foreground text-xs">借用元: {sourceContent}</p>
        <p className="text-muted-foreground text-xs">移動先: {targetContent}</p>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {item.handler ?? "未設定"}
      </TableCell>
      <TableCell>
        <Badge className={cn("text-xs", statusBadge)} variant="outline">
          {getItemStatusLabel(item.status)}
        </Badge>
        <div className="mt-2">
          <ItemStatusSelect
            aria-label={`${item.name}のステータスを変更`}
            disabled={isBusy}
            onChange={(status) => onStatusChange(item, status)}
            triggerClassName="w-[160px]"
            value={item.status}
          />
        </div>
        {isUpdating ? (
          <p className="mt-1 text-muted-foreground text-xs">更新中...</p>
        ) : null}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onShowDetail(item.id)}
            size="sm"
            type="button"
            variant="outline"
          >
            詳細
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
