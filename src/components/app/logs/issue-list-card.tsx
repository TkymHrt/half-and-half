import {
  ISSUE_KIND_BADGE_CLASS,
  ISSUE_KIND_LABEL,
  ISSUE_STATUS_BADGE_CLASS,
  ISSUE_STATUS_LABEL,
} from "@/app/protected/(app)/logs/constants";
import type { IssueListEntry } from "@/app/protected/(app)/logs/types";
import { formatIssueDate } from "@/app/protected/(app)/logs/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types/app";

type IssueListItemProps = {
  entry: IssueListEntry;
  isUpdating: boolean;
  hasPendingUpdate: boolean;
  onToggle: (issue: Issue) => void;
};

function IssueListItem({
  entry,
  isUpdating,
  hasPendingUpdate,
  onToggle,
}: IssueListItemProps) {
  const { issue, item } = entry;
  const actionLabel =
    issue.status === "open" ? "解決済みにする" : "対応中に戻す";
  const disableButton = (hasPendingUpdate && !isUpdating) || isUpdating;

  return (
    <li>
      <article className="rounded-xl border bg-card px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="flex-1 font-medium text-base text-foreground">
              {issue.summary}
            </h3>
            <Badge
              className={cn("text-xs", ISSUE_KIND_BADGE_CLASS[issue.kind])}
              variant="outline"
            >
              {ISSUE_KIND_LABEL[issue.kind]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground/90 text-xs">
            <p>
              {issue.reporter}
              <span className="mx-1">/</span>
              {formatIssueDate(issue.at)}
            </p>
            <Badge
              className={cn("text-xs", ISSUE_STATUS_BADGE_CLASS[issue.status])}
              variant="outline"
            >
              {ISSUE_STATUS_LABEL[issue.status]}
            </Badge>
          </div>
          {item ? (
            <p className="rounded-md bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
              対象物品: {item.name}
              <span className="block text-xs">移動先: {item.targetName}</span>
            </p>
          ) : null}
          {issue.detail ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {issue.detail}
            </p>
          ) : null}
          <Button
            className="w-full sm:w-auto"
            disabled={disableButton}
            onClick={() => onToggle(issue)}
            size="sm"
            type="button"
            variant={issue.status === "open" ? "secondary" : "ghost"}
          >
            {isUpdating ? "更新中..." : actionLabel}
          </Button>
        </div>
      </article>
    </li>
  );
}

type IssueListCardProps = {
  entries: IssueListEntry[];
  isInitialLoading: boolean;
  issuesCount: number;
  updatingIssueId: string | null;
  hasPendingUpdate: boolean;
  error: string | null;
  onToggleIssue: (issue: Issue) => void;
};

export function IssueListCard({
  entries,
  isInitialLoading,
  issuesCount,
  updatingIssueId,
  hasPendingUpdate,
  error,
  onToggleIssue,
}: IssueListCardProps) {
  const showSkeleton = isInitialLoading && issuesCount === 0;
  const showEmpty = !isInitialLoading && entries.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">問題一覧</CardTitle>
        <CardDescription className="text-sm">
          発生している問題を確認し、ステータスを更新できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="mb-3 text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {showSkeleton ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : null}

        {showEmpty ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground">
            現在登録されている問題はありません。
          </p>
        ) : null}

        {entries.length > 0 ? (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <IssueListItem
                entry={entry}
                hasPendingUpdate={hasPendingUpdate}
                isUpdating={updatingIssueId === entry.issue.id}
                key={entry.issue.id}
                onToggle={onToggleIssue}
              />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
