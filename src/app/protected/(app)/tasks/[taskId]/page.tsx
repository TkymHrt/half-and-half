'use client';

import { AppHeader } from '@/components/app/header';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemDetailDrawer } from '@/components/app/item-detail-drawer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ItemRepo, LogRepo, TaskRepo } from '@/lib/mock';
import { useAppStore } from '@/lib/store/app-store';
import { type Item, type ItemStatus, type Task } from '@/types/app';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const itemStatusMap: Record<ItemStatus, { label: string }> = {
  unplaced: { label: '未配置' },
  moving: { label: '移動中' },
  placed: { label: '配置済' },
  issue: { label: '問題あり' },
};

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle } = useAppStore();

  useEffect(() => {
    if (!taskId) return;
    async function fetchData() {
      setLoading(true);
      setTitle('読み込み中...');
      const [taskData, itemData] = await Promise.all([
        TaskRepo.get(taskId),
        ItemRepo.listByTaskId(taskId),
      ]);
      setTask(taskData);
      setItems(itemData);
      if (taskData) {
        setTitle(taskData.title);
      } else {
        setTitle('エラー');
      }
      setLoading(false);
    }
    fetchData();
  }, [taskId, setTitle]);

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    const originalItem = items.find((i) => i.id === itemId);
    if (!originalItem || originalItem.status === newStatus) return;

    // Optimistic update
    const updatedItems = items.map((i) =>
      i.id === itemId ? { ...i, status: newStatus } : i,
    );
    setItems(updatedItems);

    try {
      await ItemRepo.update(itemId, { status: newStatus });
      await LogRepo.create({
        actor: 'ユーザー', // In a real app, this would be the logged-in user
        type: 'item_status_changed',
        payload: {
          itemId,
          itemName: originalItem.name,
          from: originalItem.status,
          to: newStatus,
        },
      });
    } catch (error) {
      // Revert on failure
      setItems(items);
      console.error('Failed to update item status:', error);
    }
  };

  if (loading) {
    return <TaskDetailPageSkeleton />;
  }

  if (!task) {
    return (
      <div>
        <AppHeader
          action={
            <Link href="/protected/tasks">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          }
        />
        <div className="p-4 text-center">タスクが見つかりませんでした。</div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader
        action={
          <Link href="/protected/tasks" className="flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </Link>
        }
      />
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>タスク詳細</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              <strong>担当:</strong> {task.handler || '未割り当て'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>物品一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>物品名</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>場所</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <ItemDetailDrawer key={item.id} item={item}>
                    <TableRow className="cursor-pointer">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>
                            <span className="text-muted-foreground">借用元:</span>{' '}
                            {item.sourceName}
                          </p>
                          <p>
                            <span className="text-muted-foreground">移動先:</span>{' '}
                            {item.targetName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={item.status}
                          onValueChange={(value) =>
                            handleStatusChange(item.id, value as ItemStatus)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="ステータスを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(itemStatusMap).map(([status, { label }]) => (
                              <SelectItem key={status} value={status}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  </ItemDetailDrawer>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskDetailPageSkeleton() {
  return (
    <div>
      <AppHeader />
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-40" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}