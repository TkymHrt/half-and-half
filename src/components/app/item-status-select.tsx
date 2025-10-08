"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getItemStatusLabel,
  ITEM_STATUS_ORDER,
} from "@/lib/presentation/status";
import type { ItemStatus } from "@/types/app";

export type ItemStatusSelectProps = {
  value: ItemStatus;
  onChange: (status: ItemStatus) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  triggerClassName?: string;
};

export function ItemStatusSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "ステータスを選択",
  "aria-label": ariaLabel,
  triggerClassName,
}: ItemStatusSelectProps) {
 console.log("ITEM_STATUS_ORDER:", ITEM_STATUS_ORDER);
  return (
    <Select
      disabled={disabled}
      onValueChange={(next) => {
        if (next === value) {
          return;
        }
        onChange(next as ItemStatus);
      }}
      value={value}
    >
      <SelectTrigger aria-label={ariaLabel} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
  {ITEM_STATUS_ORDER.map((status) => {
    if (!status || status.trim() === "") return null;
    return (
      <SelectItem key={status} value={status}>
        {getItemStatusLabel(status)}
      </SelectItem>
    );
  })}
</SelectContent>

    </Select>
  );
}
