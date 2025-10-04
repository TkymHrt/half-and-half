'use client';

import { AppHeader } from '@/components/app/header';
import { IssueReportDialog } from '@/components/app/issue-report-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogRepo } from '@/lib/mock';
import { useAppStore } from '@/lib/store/app-store';
import { type LogEvent } from '@/types/app';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEffect, useState } from 'react';

function getLogMessage(log: LogEvent): string {
  switch (log.type) {
    case 'task_created':
      return `タスク「${log.payload.title}」が作成されました。`;
    case 'item_added':
      return `タスク「${log.payload.taskTitle}」に物品「${log.payload.itemName}」が追加されました。`;
    case 'item_status_changed':
      return `物品「${log.payload.itemName}」のステータスが「${log.payload.from}」から「${log.payload.to}」に更新されました。`;
    case 'issue_reported':
      return `問題「${log.payload.summary}」が報告されました。`;
    case 'item_photo_uploaded':
      return `物品「${log.payload.itemName}」に写真が添付されました。`;
    default:
      return '新しい活動がありました。';
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle } = useAppStore();

  useEffect(() => {
    setTitle('ログ');
    async function fetchData() {
      setLoading(true);
      const logData = await LogRepo.list();
      setLogs(logData);
      setLoading(false);
    }
    fetchData();
  }, [setTitle]);

  return (
    <div>
      <AppHeader action={<IssueReportDialog />} />
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>活動履歴</CardTitle>
            <CardDescription>システム内の全ての活動が記録されます。</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-6 border-l-2 border-border pl-6">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[31px] top-1 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm font-medium">{getLogMessage(log)}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.actor} -{' '}
                      {format(new Date(log.at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </p>
                  </div>
                ))}
                {logs.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">ログはまだありません。</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}