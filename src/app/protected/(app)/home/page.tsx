'use client';

import { AppHeader } from '@/components/app/header';
import { IssueRepo, LogRepo, TaskRepo } from '@/lib/mock';
import { useAppStore } from '@/lib/store/app-store';
import { type Issue, type LogEvent, type Task } from '@/types/app';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock, ListTodo } from 'lucide-react';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle, setLastSeenLogAt } = useAppStore();

  useEffect(() => {
    setTitle('ホーム');
    async function fetchData() {
      try {
        const [taskData, issueData, logData] = await Promise.all([
          TaskRepo.list(),
          IssueRepo.list(),
          LogRepo.list(),
        ]);
        setTasks(taskData);
        setIssues(issueData);
        const latestLogs = logData.slice(0, 5);
        setLogs(latestLogs);
        if (latestLogs.length > 0) {
          setLastSeenLogAt(new Date().toISOString());
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setTitle, setLastSeenLogAt]);

  const summary = {
    not_started: tasks.filter((t) => t.status === 'not_started').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    total: tasks.length,
  };

  const openIssuesCount = issues.filter((i) => i.status === 'open').length;

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="bg-muted/40 min-h-screen">
      <AppHeader />
      <div className="p-4 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>タスク進捗サマリー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1 text-sm font-medium">
                <span>完了</span>
                <span>
                  {summary.done} / {summary.total} 件
                </span>
              </div>
              <Progress value={summary.total > 0 ? (summary.done / summary.total) * 100 : 0} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="font-bold text-lg">{summary.not_started}</p>
                <p className="text-xs text-muted-foreground">未着手</p>
              </div>
              <div>
                <ListTodo className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="font-bold text-lg">{summary.in_progress}</p>
                <p className="text-xs text-muted-foreground">進行中</p>
              </div>
              <div>
                <CheckCircle className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="font-bold text-lg">{summary.done}</p>
                <p className="text-xs text-muted-foreground">完了</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/protected/logs">
          <Card className="hover:bg-muted/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未対応の問題</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openIssuesCount} 件</div>
              <p className="text-xs text-muted-foreground">クリックして詳細を確認</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>お知らせ</CardTitle>
            <CardDescription>直近の活動ログ</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-sm">{getLogMessage(log)}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.actor} - {format(new Date(log.at), 'MM/dd HH:mm')}
                    </p>
                  </div>
                </li>
              ))}
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground">ログはまだありません。</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getLogMessage(log: LogEvent): string {
  switch (log.type) {
    case 'task_created':
      return `タスク「${log.payload.title}」が作成されました。`;
    case 'item_status_changed':
      return `物品「${log.payload.itemName}」のステータスが更新されました。`;
    case 'issue_reported':
      return `問題「${log.payload.summary}」が報告されました。`;
    case 'item_photo_uploaded':
      return `物品「${log.payload.itemName}」の写真が追加されました。`;
    default:
      return '新しい活動がありました。';
  }
}

function HomePageSkeleton() {
  const { setTitle } = useAppStore();
  useEffect(() => {
    setTitle('ホーム');
  }, [setTitle]);

  return (
    <div>
      <AppHeader />
      <div className="p-4 grid gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}