import type { ItemStatus, RelativePoint } from "@/types/app";

export type DraftLocationPin = {
  areaId?: string;
  floorId?: string;
  source?: RelativePoint;
  target?: RelativePoint;
};

export type DraftItem = {
  id: string;
  name: string;
  quantity: string;
  sourceName: string;
  targetName: string;
  handler: string;
  status: ItemStatus;
  pin?: DraftLocationPin;
};

export type DraftItemFieldError = {
  name?: string;
  quantity?: string;
  sourceName?: string;
  targetName?: string;
  pin?: string;
};

export type DraftItemErrorMap = Record<string, DraftItemFieldError>;

export type DraftValidationResult = {
  isValid: boolean;
  errors: DraftItemErrorMap;
  message: string | null;
};

export type PinEditMode = "source" | "target";
