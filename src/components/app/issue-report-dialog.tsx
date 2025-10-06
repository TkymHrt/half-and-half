"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IssueRepository } from "@/lib/mock/repositories/issues";
import { LogRepository } from "@/lib/mock/repositories/logs";
import type { Issue, Item, LogEvent } from "@/types/app";

const ISSUE_KIND_LABEL: Record<Issue["kind"], string> = {
  damage: "破損",
  loss: "紛失",
  other: "その他",
};

const ISSUE_KIND_OPTIONS = ["loss", "damage", "other"] as const;
const ISSUE_DETAIL_MAX_LENGTH = 2000;
const LOG_ID_RADIX = 36;

const formSchema = z.object({
  reporter: z.string().trim().min(1, "報告者を入力してください"),
  summary: z.string().trim().min(1, "概要を入力してください"),
  detail: z
    .string()
    .trim()
    .max(ISSUE_DETAIL_MAX_LENGTH, "詳細は2000文字以内で入力してください")
    .optional(),
  kind: z.enum(ISSUE_KIND_OPTIONS),
  itemId: z.string().min(1).optional(),
});

export type IssueReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: (context: { issue: Issue; log: LogEvent }) => void;
  items: Item[];
};

type IssueFormValues = z.infer<typeof formSchema>;

function createLogId(): string {
  return `log-${Date.now().toString(LOG_ID_RADIX)}`;
}

function createIssueLogEvent(params: {
  issue: Issue;
  reporter: string;
}): LogEvent {
  return {
    id: createLogId(),
    at: new Date().toISOString(),
    actor: params.reporter,
    type: "issue_reported",
    payload: {
      issueId: params.issue.id,
      summary: params.issue.summary,
      itemId: params.issue.itemId,
    },
  } satisfies LogEvent;
}

export function IssueReportDialog({
  open,
  onOpenChange,
  onSubmitted,
  items,
}: IssueReportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectableItems = useMemo(
    () => items.slice().sort((a, b) => a.name.localeCompare(b.name, "ja")),
    [items]
  );

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reporter: "",
      summary: "",
      detail: "",
      kind: "loss",
      itemId: undefined,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        reporter: "",
        summary: "",
        detail: "",
        kind: "loss",
        itemId: undefined,
      });
      setErrorMessage(null);
    }
  }, [form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const trimmedDetail = values.detail?.trim();
      const issue = await IssueRepository.create({
        reporter: values.reporter.trim(),
        summary: values.summary.trim(),
        kind: values.kind,
        detail: trimmedDetail ? trimmedDetail : undefined,
        itemId: values.itemId,
      });

      const logEvent = createIssueLogEvent({
        issue,
        reporter: issue.reporter,
      });
      await LogRepository.add(logEvent);

      toast.success("問題を報告しました");

      onSubmitted?.({ issue, log: logEvent });
      onOpenChange(false);
    } catch {
      setErrorMessage(
        "問題の報告に失敗しました。時間をおいて再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>問題を報告する</DialogTitle>
          <DialogDescription>
            発生した問題の概要と状況を記録し、共有します。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="reporter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>報告者</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="例: 佐藤 (模擬店班)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>問題の種類</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="問題の種類を選択">
                          <SelectValue placeholder="問題種別を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ISSUE_KIND_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {ISSUE_KIND_LABEL[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>対象の物品 (任意)</FormLabel>
                    <Select
                      disabled={isSubmitting || selectableItems.length === 0}
                      onValueChange={(value) => {
                        if (!value) {
                          field.onChange(undefined);
                          return;
                        }
                        field.onChange(value);
                      }}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="対象の物品を選択">
                          <SelectValue placeholder="対象の物品を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">指定しない</SelectItem>
                        {selectableItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>概要</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="例: テントの支柱が不足しています"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="detail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>詳細 (任意)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="状況や対応状況を詳しく記入してください"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorMessage ? (
              <p className="text-destructive text-sm" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="ghost"
              >
                キャンセル
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "送信中..." : "報告を送信"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
