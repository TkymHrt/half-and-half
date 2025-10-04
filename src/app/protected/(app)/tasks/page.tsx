'use client';

import { AppHeader } from '@/components/app/header';
import { TaskCreateDialog } from '@/components/app/task-create-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskRepo } from '@/lib/mock';
import { useAppStore } from '@/lib/store/app-store';
import { type Task, type TaskStatus } from '@/types/app';
import { format } from 'date-fns';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ja } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const statusMap: Record<TaskStatus, { label: string; color: 'default' | 'secondary' | 'destructive' }> = {
  not_started: { label: '未着手', color: 'destructive' },
  in_progress: { label: '進行中', color: 'secondary' },
  done: { label: '完了', color: 'default' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { setTitle } = useAppStore();

  useEffect(() => {
    setTitle('タスク一覧');
    async function fetchData() {
      setLoading(true);
      const taskData = await TaskRepo.list();
      setTasks(taskData);
      setLoading(false);
    }
    fetchData();
  }, [setTitle]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  const renderTaskList = (status?: TaskStatus) => {
    const tasksToRender = status
      ? filteredTasks.filter((t) => t.status === status)
      : filteredTasks;

    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (tasksToRender.length === 0) {
      return <p className="text-center text-sm text-muted-foreground py-8">該当するタスクはありません。</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>タスク名</TableHead>
            <TableHead>担当</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>作成日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasksToRender.map((task) => (
            <TableRow key={task.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link href={`/protected/tasks/${task.id}`} className="hover:underline">
                  {task.title}
                </Link>
              </TableCell>
              <TableCell>{task.handler || '未割り当て'}</TableCell>
              <TableCell>
                <Badge variant={statusMap[task.status].color}>
                  {statusMap[task.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(task.createdAt), 'yyyy/MM/dd', { locale: ja })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div>
      <AppHeader action={<TaskCreateDialog />} />
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>全てのタスク</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="タスク名で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">全て</TabsTrigger>
                <TabsTrigger value="not_started">未着手</TabsTrigger>
                <TabsTrigger value="in_progress">進行中</TabsTrigger>
                <TabsTrigger value="done">完了</TabsTrigger>
              </TabsList>
              <TabsContent value="all">{renderTaskList()}</TabsContent>
              <TabsContent value="not_started">{renderTaskList('not_started')}</TabsContent>
              <TabsContent value="in_progress">{renderTaskList('in_progress')}</TabsContent>
              <TabsContent value="done">{renderTaskList('done')}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}