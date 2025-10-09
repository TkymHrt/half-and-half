import { z } from "zod";

import { MAX_DESCRIPTION_LENGTH, MAX_HANDLER_LENGTH } from "./constants";

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "タスク名を入力してください"),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, "説明は2000文字以内で入力してください")
    .optional(),
  handler: z
    .string()
    .trim()
    .max(MAX_HANDLER_LENGTH, "担当者は120文字以内で入力してください")
    .optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
