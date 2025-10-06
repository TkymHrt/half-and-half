"use client";

import type { UseFormReturn } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { TaskFormValues } from "../schema";

export type TaskDetailsStepProps = {
  form: UseFormReturn<TaskFormValues>;
};

export function TaskDetailsStep({ form }: TaskDetailsStepProps) {
  return (
    <Form {...form}>
      <form className="space-y-4" role="presentation">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                タスク名 <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  className="min-h-[44px]"
                  placeholder="例: 体育館ステージ設営"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                説明{" "}
                <span className="text-muted-foreground text-xs">(任意)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[44px] resize-none"
                  placeholder="タスクの概要や注意事項を入力"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="handler"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                担当者{" "}
                <span className="text-muted-foreground text-xs">(任意)</span>
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  className="min-h-[44px]"
                  placeholder="例: 総務局 佐藤"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
