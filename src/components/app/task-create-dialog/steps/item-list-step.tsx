"use client";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  return (
    <section
      aria-label={`${index + 1}件目の物品`}
      className={`rounded-lg border p-4 transition ${isActive ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          aria-label={`物品 ${index + 1} を選択`}
          className="text-left"
          onClick={() => onSelect(item.id)}
          type="button"
        >
          <p className="font-medium text-foreground text-sm">
            {item.name || `物品 ${index + 1}`}
          </p>
          <p className="text-muted-foreground text-xs">
            ステータス: {getItemStatusLabel(item.status)}
          </p>
        </button>
        {canRemove ? (
          <Button
            onClick={() => onRemove(item.id)}
            size="sm"
            type="button"
            variant="ghost"
          >
            削除
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`item-name-${item.id}`}>物品名</Label>
          <Input
            autoComplete="off"
            id={`item-name-${item.id}`}
            onChange={(event) =>
              onChange(item.id, { name: event.target.value })
            }
            placeholder="例: テント"
            value={item.name}
          />
          {errors?.name ? <FormMessage>{errors.name}</FormMessage> : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`item-quantity-${item.id}`}>数量</Label>
          <Input
            autoComplete="off"
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
        <div className="space-y-1">
          <Label htmlFor={`item-source-${item.id}`}>借用元</Label>
          <Input
            autoComplete="off"
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
        <div className="space-y-1">
          <Label htmlFor={`item-target-${item.id}`}>移動先</Label>
          <Input
            autoComplete="off"
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
        <div className="space-y-1">
          <Label htmlFor={`item-handler-${item.id}`}>担当者 (任意)</Label>
          <Input
            autoComplete="off"
            id={`item-handler-${item.id}`}
            onChange={(event) =>
              onChange(item.id, { handler: event.target.value })
            }
            placeholder="例: 模擬店班 佐藤"
            value={item.handler}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`item-status-${item.id}`}>ステータス</Label>
          <Select
            onValueChange={(value) =>
              onChange(item.id, { status: value as ItemStatus })
            }
            value={item.status}
          >
            <SelectTrigger id={`item-status-${item.id}`}>
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
      {errors?.pin ? (
        <p className="mt-3 text-destructive text-sm">{errors.pin}</p>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">物品</p>
          <p className="text-muted-foreground text-xs">
            物品名と数量、借用元/移動先を入力してください
          </p>
        </div>
        <Button onClick={onAdd} size="sm" type="button" variant="outline">
          物品を追加
        </Button>
      </div>
      <ScrollArea className="max-h-[26rem] pr-4">
        <div className="space-y-4">
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
      </ScrollArea>
    </div>
  );
}
