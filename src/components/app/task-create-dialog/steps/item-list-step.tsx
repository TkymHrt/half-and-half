"use client";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import { CrossIcon } from "@/components/ui/icons/akar-icons-cross";
import { PlusIcon } from "@/components/ui/icons/akar-icons-plus";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getItemStatusLabel } from "@/lib/presentation/status";
import type { ItemStatus } from "@/types/app";
import type {
  DraftItem,
  DraftItemErrorMap,
  DraftItemFieldError,
} from "../types";

const ITEM_STATUS_OPTIONS: ItemStatus[] = [
  "unplaced",
  "moving",
  "placed",
  "issue",
];

type ItemCardProps = {
  item: DraftItem;
  index: number;
  isActive: boolean;
  canRemove: boolean;
  errors: DraftItemFieldError | undefined;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<DraftItem>) => void;
};

type ItemCardFormProps = {
  item: DraftItem;
  errors: DraftItemFieldError | undefined;
  onChange: (id: string, patch: Partial<DraftItem>) => void;
};

function ItemCardForm({ item, errors, onChange }: ItemCardFormProps) {
  return (
    <div className="space-y-3 border-t px-3 py-3 sm:px-4 sm:py-4">
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`item-name-${item.id}`}>
            物品名 <span className="text-destructive">*</span>
          </Label>
          <Input
            autoComplete="off"
            className="min-h-[44px]"
            id={`item-name-${item.id}`}
            onChange={(event) =>
              onChange(item.id, { name: event.target.value })
            }
            placeholder="例: テント"
            value={item.name}
          />
          {errors?.name ? <FormMessage>{errors.name}</FormMessage> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`item-quantity-${item.id}`}>
              数量 <span className="text-destructive">*</span>
            </Label>
            <Input
              autoComplete="off"
              className="min-h-[44px]"
              id={`item-quantity-${item.id}`}
              inputMode="numeric"
              onChange={(event) =>
                onChange(item.id, { quantity: event.target.value })
              }
              placeholder="1"
              value={item.quantity}
            />
            {errors?.quantity ? (
              <FormMessage>{errors.quantity}</FormMessage>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`item-status-${item.id}`}>ステータス</Label>
            <Select
              onValueChange={(value) =>
                onChange(item.id, { status: value as ItemStatus })
              }
              value={item.status}
            >
              <SelectTrigger
                className="min-h-[44px]"
                id={`item-status-${item.id}`}
              >
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getItemStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`item-source-${item.id}`}>
              借用元 <span className="text-destructive">*</span>
            </Label>
            <Input
              autoComplete="off"
              className="min-h-[44px]"
              id={`item-source-${item.id}`}
              onChange={(event) =>
                onChange(item.id, { sourceName: event.target.value })
              }
              placeholder="例: 第二倉庫"
              value={item.sourceName}
            />
            {errors?.sourceName ? (
              <FormMessage>{errors.sourceName}</FormMessage>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`item-target-${item.id}`}>
              移動先 <span className="text-destructive">*</span>
            </Label>
            <Input
              autoComplete="off"
              className="min-h-[44px]"
              id={`item-target-${item.id}`}
              onChange={(event) =>
                onChange(item.id, { targetName: event.target.value })
              }
              placeholder="例: 体育館ステージ"
              value={item.targetName}
            />
            {errors?.targetName ? (
              <FormMessage>{errors.targetName}</FormMessage>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`item-handler-${item.id}`}>
            担当者 <span className="text-muted-foreground text-xs">(任意)</span>
          </Label>
          <Input
            autoComplete="off"
            className="min-h-[44px]"
            id={`item-handler-${item.id}`}
            onChange={(event) =>
              onChange(item.id, { handler: event.target.value })
            }
            placeholder="例: 模擬店班 佐藤"
            value={item.handler}
          />
        </div>
      </div>
      {errors?.pin ? (
        <p className="text-destructive text-sm" role="alert">
          {errors.pin}
        </p>
      ) : null}
    </div>
  );
}

function ItemCard({
  item,
  index,
  isActive,
  canRemove,
  errors,
  onSelect,
  onRemove,
  onChange,
}: ItemCardProps) {
  const hasErrors = Boolean(errors && Object.keys(errors).length > 0);

  let borderClass = "border-border";
  if (isActive) {
    borderClass = "border-primary bg-primary/5 shadow-sm";
  } else if (hasErrors) {
    borderClass = "border-destructive/50";
  }

  return (
    <section
      aria-label={`${index + 1}件目の物品`}
      className={`rounded-lg border transition ${borderClass}`}
    >
      <button
        aria-expanded={isActive}
        aria-label={`物品 ${index + 1} を選択`}
        className="w-full p-3 text-left sm:p-4"
        onClick={() => onSelect(item.id)}
        type="button"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">
              {item.name || `物品 ${index + 1}`}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
              <span>{getItemStatusLabel(item.status)}</span>
              {item.quantity ? (
                <>
                  <span>•</span>
                  <span>数量: {item.quantity}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasErrors ? (
              <span className="text-destructive text-xs">未入力あり</span>
            ) : null}
            {canRemove ? (
              <Button
                aria-label={`物品 ${index + 1} を削除`}
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <CrossIcon />
              </Button>
            ) : null}
          </div>
        </div>
      </button>

      {isActive ? (
        <ItemCardForm errors={errors} item={item} onChange={onChange} />
      ) : null}
    </section>
  );
}

export type ItemListStepProps = {
  items: DraftItem[];
  errors: DraftItemErrorMap;
  selectedItemId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<DraftItem>) => void;
};

export function ItemListStep({
  items,
  errors,
  selectedItemId,
  onSelect,
  onAdd,
  onRemove,
  onChange,
}: ItemListStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm sm:text-base">物品リスト</p>
          <p className="text-muted-foreground text-xs">
            {items.length}件登録済み • タップして編集
          </p>
        </div>
        <Button
          className="min-h-[44px] shrink-0"
          onClick={onAdd}
          size="default"
          type="button"
          variant="default"
        >
          <PlusIcon />
          追加
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <ItemCard
            canRemove={items.length > 1}
            errors={errors[item.id]}
            index={index}
            isActive={item.id === selectedItemId}
            item={item}
            key={item.id}
            onChange={onChange}
            onRemove={onRemove}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
