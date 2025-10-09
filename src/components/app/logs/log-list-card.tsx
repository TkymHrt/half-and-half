import {
  ITEM_STATUS_LABEL,
  LOG_TYPE_BADGE_CLASS,
} from "@/app/protected/(app)/logs/constants";
import type { LogListEntry } from "@/app/protected/(app)/logs/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LogFilters, type LogFiltersFormProps } from "./log-filters";

type LogListCardProps = {
  filters: LogFiltersFormProps;
  entries: LogListEntry[];
  initialError: string | null;
  isInitialLoading: boolean;
  isEmptyState: boolean;
  loadMoreError: string | null;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
};

export function LogListCard({
  filters,
  entries,
  initialError,
  isInitialLoading,
  isEmptyState,
  loadMoreError,
  isLoadingMore,
  hasMore,
  loadMoreRef,
}: LogListCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">活動ログ</CardTitle>
        <CardDescription className="text-sm">
          最新の活動や問題報告を時系列で表示します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LogFilters {...filters} />

        {initialError ? (
          <p className="text-destructive text-sm" role="alert">
            {initialError}
          </p>
        ) : null}

        {isInitialLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : null}

        {isEmptyState ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground">
            {filters.hasActiveFilters
              ? "条件に一致するログがありません。検索条件を調整してください。"
              : "まだ表示できるログがありません。操作を行うとここに履歴が記録されます。"}
          </p>
        ) : null}

        {entries.length > 0 ? (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <article className="rounded-xl border bg-card px-4 py-4 shadow-sm">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium text-base text-foreground">
                          {entry.title}
                        </h3>
                        {entry.description ? (
                          <p className="text-muted-foreground text-sm">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          LOG_TYPE_BADGE_CLASS.get(entry.type) ?? ""
                        )}
                        variant="outline"
                      >
                        {entry.typeLabel}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground/90 text-xs">
                      {entry.actor} / {entry.occurredAtText}（
                      {entry.relativeTime}）
                    </p>
                    {entry.item ? (
                      <div className="rounded-md bg-muted/40 px-3 py-3 text-muted-foreground/90 text-xs">
                        <p className="font-medium text-foreground text-sm">
                          対象物品: {entry.item.name}
                        </p>
                        <p className="mt-1 leading-relaxed">
                          借用元: {entry.item.sourceName}
                          <br />
                          移動先: {entry.item.targetName}
                          <br />
                          ステータス: {ITEM_STATUS_LABEL[entry.item.status]}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : null}

        {loadMoreError ? (
          <p className="text-center text-destructive text-sm" role="alert">
            {loadMoreError}
          </p>
        ) : null}

        {hasMore ? (
          <div aria-hidden="true" className="h-4 w-full" ref={loadMoreRef} />
        ) : null}

        {isLoadingMore ? (
          <div className="flex items-center justify-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <span className="text-muted-foreground text-xs">読み込み中...</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
