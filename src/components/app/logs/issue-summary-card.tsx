import type { IssueStats } from "@/app/protected/(app)/logs/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type IssueSummaryCardProps = {
  stats: IssueStats;
};

export function IssueSummaryCard({ stats }: IssueSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">問題の状況</CardTitle>
        <CardDescription className="text-sm">
          未対応の問題件数と対応済み件数のサマリーです。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card px-4 py-3">
            <dt className="text-muted-foreground text-xs">総件数</dt>
            <dd className="mt-1 font-semibold text-2xl text-foreground">
              {stats.total}
            </dd>
            <p className="mt-1 text-muted-foreground/90 text-xs">
              登録済みの問題レポート件数
            </p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <dt className="text-muted-foreground text-xs">対応中</dt>
            <dd className="mt-1 font-semibold text-2xl text-destructive">
              {stats.open}
            </dd>
            <p className="mt-1 text-muted-foreground/90 text-xs">
              対応が必要な問題
            </p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <dt className="text-muted-foreground text-xs">解決済み</dt>
            <dd className="mt-1 font-semibold text-2xl text-emerald-600">
              {stats.resolved}
            </dd>
            <p className="mt-1 text-muted-foreground/90 text-xs">
              対応完了として記録された件数
            </p>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
