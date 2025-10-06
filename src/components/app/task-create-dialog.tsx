"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createTaskWithItems } from "@/lib/application/activity";
import { AreaRepository } from "@/lib/mock/repositories/areas";
import type { Area, Item, LogEvent, RelativePoint, Task } from "@/types/app";

import { PERCENT_SCALE, STEP_LABELS } from "./task-create-dialog/constants";
import {
  type TaskFormValues,
  taskFormSchema,
} from "./task-create-dialog/schema";
import { ItemListStep } from "./task-create-dialog/steps/item-list-step";
import { PinPlacementStep } from "./task-create-dialog/steps/pin-placement-step";
import { TaskDetailsStep } from "./task-create-dialog/steps/task-details-step";
import type {
  DraftItem,
  DraftItemErrorMap,
  DraftItemFieldError,
  PinEditMode,
} from "./task-create-dialog/types";
import { useTaskDrafts } from "./task-create-dialog/use-task-drafts";
import {
  createItemInputFromDraft,
  mergeDraftErrors,
  toOptionalTrimmed,
} from "./task-create-dialog/utils";
import {
  validateDraftItems,
  validateDraftPins,
} from "./task-create-dialog/validation";

const TOTAL_STEPS = STEP_LABELS.length;

export type TaskCreateDialogProps = {
  trigger?: ReactNode;
  onCreated?: (context: {
    task: Task;
    items: Item[];
    logs: LogEvent[];
  }) => void;
};

function removeErrorsForFields(
  errors: DraftItemErrorMap,
  id: string,
  fields: Array<keyof DraftItemFieldError>
): DraftItemErrorMap {
  const current = errors[id];
  if (!current) {
    return errors;
  }

  const next = { ...current };
  let changed = false;
  for (const field of fields) {
    if (field in next) {
      delete next[field];
      changed = true;
    }
  }

  if (!changed) {
    return errors;
  }

  if (Object.keys(next).length === 0) {
    const { [id]: _removed, ...rest } = errors;
    return rest;
  }

  return { ...errors, [id]: next };
}

function omitError(errors: DraftItemErrorMap, id: string): DraftItemErrorMap {
  if (!(id in errors)) {
    return errors;
  }

  const { [id]: _removed, ...rest } = errors;
  return rest;
}

export function TaskCreateDialog({
  trigger,
  onCreated,
}: TaskCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<DraftItemErrorMap>({});
  const [pinErrors, setPinErrors] = useState<DraftItemErrorMap>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinEditMode, setPinEditMode] = useState<PinEditMode>("source");

  const {
    items,
    selectedItemId,
    selectedItem,
    selectItem,
    addItem,
    removeItem,
    updateItemFields,
    setArea,
    setFloor,
    setPinPoint,
    reset,
  } = useTaskDrafts();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      handler: "",
    },
    mode: "onSubmit",
  });

  const combinedErrors = useMemo(
    () => mergeDraftErrors(fieldErrors, pinErrors),
    [fieldErrors, pinErrors]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setIsLoadingAreas(true);
    AreaRepository.list()
      .then((data) => {
        if (!active) {
          return;
        }
        setAreas(data);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setAreas([]);
        setErrorMessage(
          "図面データの読み込みに失敗しました。時間をおいて再度お試しください。"
        );
      })
      .finally(() => {
        if (active) {
          setIsLoadingAreas(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      return;
    }

    form.reset({ title: "", description: "", handler: "" });
    reset();
    setCurrentStep(0);
    setFieldErrors({});
    setPinErrors({});
    setErrorMessage(null);
    setIsSubmitting(false);
    setPinEditMode("source");
  }, [form, open, reset]);

  const handleNext = async () => {
    setErrorMessage(null);
    if (currentStep === 0) {
      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      const result = validateDraftItems(items);
      setFieldErrors(result.errors);
      if (!result.isValid) {
        setErrorMessage(result.message);
        return;
      }
      setErrorMessage(null);
      setCurrentStep(2);
      return;
    }
  };

  const handlePrevious = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleChangeItem = (id: string, patch: Partial<DraftItem>) => {
    updateItemFields(id, patch);

    const fields: Array<keyof DraftItemFieldError> = [];
    if ("name" in patch) {
      fields.push("name");
    }
    if ("quantity" in patch) {
      fields.push("quantity");
    }
    if ("sourceName" in patch) {
      fields.push("sourceName");
    }
    if ("targetName" in patch) {
      fields.push("targetName");
    }

    if (fields.length > 0) {
      setFieldErrors((prev) => removeErrorsForFields(prev, id, fields));
    }
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    setFieldErrors((prev) => omitError(prev, id));
    setPinErrors((prev) => omitError(prev, id));
  };

  const handleAddItem = () => {
    addItem();
  };

  const handleSelectArea = (itemId: string, areaId: string | null) => {
    setArea(itemId, areaId);
    setPinErrors((prev) => omitError(prev, itemId));
  };

  const handleSelectFloor = (itemId: string, floorId: string | null) => {
    setFloor(itemId, floorId);
    setPinErrors((prev) => omitError(prev, itemId));
  };

  const handlePlacePin = (
    itemId: string,
    mode: PinEditMode,
    point: RelativePoint
  ) => {
    setPinPoint(itemId, mode, point);
    setPinErrors((prev) => omitError(prev, itemId));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const itemValidation = validateDraftItems(items);
    setFieldErrors(itemValidation.errors);
    if (!itemValidation.isValid) {
      setErrorMessage(itemValidation.message);
      setCurrentStep(1);
      return;
    }

    const pinValidation = validateDraftPins(items);
    setPinErrors(pinValidation.errors);
    if (!pinValidation.isValid) {
      setErrorMessage(pinValidation.message);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const trimmedTitle = values.title.trim();
      const description = toOptionalTrimmed(values.description);
      const handler = toOptionalTrimmed(values.handler);

      const {
        task: createdTask,
        items: createdItems,
        logs,
      } = await createTaskWithItems({
        title: trimmedTitle,
        description,
        handler,
        items: items.map((draft) => createItemInputFromDraft(draft)),
      });

      toast.success("タスクを作成しました");
      onCreated?.({ task: createdTask, items: createdItems, logs });
      setOpen(false);
    } catch {
      setErrorMessage(
        "タスクの作成に失敗しました。時間をおいて再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * PERCENT_SCALE;

  let primaryButtonLabel = "次へ";
  if (isLastStep) {
    primaryButtonLabel = "タスクを作成";
  }
  if (isSubmitting) {
    primaryButtonLabel = "送信中...";
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>タスクを作成する</DialogTitle>
          <DialogDescription>
            {STEP_LABELS[currentStep]}の入力内容を確認しながら進めてください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Progress aria-label="進捗状況" value={progressValue} />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
              {STEP_LABELS.map((label, index) => (
                <span
                  aria-current={index === currentStep}
                  className={`rounded-full px-2 py-1 ${
                    index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  key={label}
                >
                  {index + 1}. {label}
                </span>
              ))}
            </div>
          </div>

          <Separator />

          {currentStep === 0 ? <TaskDetailsStep form={form} /> : null}

          {currentStep === 1 ? (
            <ItemListStep
              errors={combinedErrors}
              items={items}
              onAdd={handleAddItem}
              onChange={(id, patch) => handleChangeItem(id, patch)}
              onRemove={handleRemoveItem}
              onSelect={selectItem}
              selectedItemId={selectedItemId}
            />
          ) : null}

          {currentStep === 2 ? (
            <PinPlacementStep
              areas={areas}
              editMode={pinEditMode}
              errors={combinedErrors}
              isLoadingAreas={isLoadingAreas}
              items={items}
              onEditModeChange={setPinEditMode}
              onPlacePin={handlePlacePin}
              onSelectArea={handleSelectArea}
              onSelectFloor={handleSelectFloor}
              onSelectItem={selectItem}
              selectedItem={selectedItem}
              selectedItemId={selectedItemId}
            />
          ) : null}

          {errorMessage ? (
            <p className="text-destructive text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <DialogFooter className="mt-6 gap-2 sm:space-x-0">
          {currentStep > 0 ? (
            <Button
              disabled={isSubmitting}
              onClick={handlePrevious}
              type="button"
              variant="ghost"
            >
              戻る
            </Button>
          ) : (
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              キャンセル
            </Button>
          )}
          <Button
            disabled={isSubmitting}
            onClick={async () => {
              if (isLastStep) {
                await onSubmit();
                return;
              }
              await handleNext();
            }}
            type="button"
          >
            {primaryButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
