import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { LogTypeFilter } from "@/app/protected/(app)/logs/types";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type LogFiltersFormProps = {
  keyword: string;
  startDate: string;
  endDate: string;
  logType: LogTypeFilter;
  hasActiveFilters: boolean;
  disabled: boolean;
  onKeywordChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onLogTypeChange: (value: LogTypeFilter) => void;
  onClear: () => void;
};

type LogFiltersProps = LogFiltersFormProps & {
  className?: string;
};

function LogFiltersForm({
  keyword,
  startDate,
  endDate,
  logType,
  hasActiveFilters,
  disabled,
  onKeywordChange,
  onStartDateChange,
  onEndDateChange,
  onLogTypeChange,
  onClear,
}: LogFiltersFormProps) {
  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-1.5">
        <Label
          className="text-muted-foreground text-xs"
          htmlFor="log-search-input"
        >
          キーワード
        </Label>
        <Input
          autoComplete="off"
          id="log-search-input"
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="担当者・物品名・概要で検索"
          value={keyword}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="text-muted-foreground text-xs"
          htmlFor="log-start-date"
        >
          開始日
        </Label>
        <Input
          id="log-start-date"
          max={endDate || undefined}
          onChange={(event) => onStartDateChange(event.target.value)}
          type="date"
          value={startDate}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs" htmlFor="log-end-date">
          終了日
        </Label>
        <Input
          id="log-end-date"
          min={startDate || undefined}
          onChange={(event) => onEndDateChange(event.target.value)}
          type="date"
          value={endDate}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="text-muted-foreground text-xs"
          htmlFor="log-type-filter"
        >
          種別
        </Label>
        <Select
          onValueChange={(value) => {
            onLogTypeChange(value as LogTypeFilter);
          }}
          value={logType}
        >
          <SelectTrigger id="log-type-filter">
            <SelectValue placeholder="種類を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="task_created">タスク作成</SelectItem>
            <SelectItem value="item_added">物品追加</SelectItem>
            <SelectItem value="item_status_changed">ステータス更新</SelectItem>
            <SelectItem value="issue_reported">問題報告</SelectItem>
            <SelectItem value="issue_status_changed">問題対応</SelectItem>
            <SelectItem value="item_photo_uploaded">写真登録</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button
          className="w-full sm:w-auto"
          disabled={!hasActiveFilters || disabled}
          onClick={onClear}
          type="button"
          variant="ghost"
        >
          条件をクリア
        </Button>
      </div>
    </form>
  );
}

export function LogFilters({ className, ...formProps }: LogFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="md:hidden">
        <Collapsible onOpenChange={setIsMobileOpen} open={isMobileOpen}>
          <CollapsibleTrigger asChild>
            <Button
              aria-expanded={isMobileOpen}
              className="flex w-full items-center justify-between gap-2"
              type="button"
              variant="outline"
            >
              <span>絞り込み条件</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 transition-transform",
                  isMobileOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <LogFiltersForm {...formProps} />
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className="hidden md:block">
        <LogFiltersForm {...formProps} />
      </div>
    </div>
  );
}
