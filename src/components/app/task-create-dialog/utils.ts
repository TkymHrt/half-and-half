import type { TaskItemCreateInput } from "@/lib/application/activity";
import type { RelativePoint } from "@/types/app";
import {
  DRAFT_ID_PREFIX,
  PERCENT_SCALE,
  QUANTITY_MIN,
  RADIX_36,
} from "./constants";
import type { DraftItem, DraftItemErrorMap } from "./types";

const draftCounter = { value: 0 };

export function generateDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${DRAFT_ID_PREFIX}${crypto.randomUUID()}`;
  }

  draftCounter.value += 1;
  return `${DRAFT_ID_PREFIX}${(Date.now() + draftCounter.value).toString(RADIX_36)}`;
}

export function createInitialDraft(): DraftItem {
  return {
    id: generateDraftId(),
    name: "",
    quantity: "1",
    sourceName: "",
    targetName: "",
    handler: "",
    status: "unplaced",
    pin: undefined,
  } satisfies DraftItem;
}

export function toOptionalTrimmed(value?: string | null): string | undefined {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : undefined;
}

export function parseQuantity(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function formatPoint(
  point: RelativePoint,
  fractionDigits: number
): string {
  const percentX = (point.x * PERCENT_SCALE).toFixed(fractionDigits);
  const percentY = (point.y * PERCENT_SCALE).toFixed(fractionDigits);
  return `${percentX}%, ${percentY}%`;
}

export function mergeDraftErrors(
  ...maps: DraftItemErrorMap[]
): DraftItemErrorMap {
  const merged: DraftItemErrorMap = {};

  for (const map of maps) {
    for (const [id, errors] of Object.entries(map)) {
      merged[id] = { ...merged[id], ...errors };
    }
  }

  return merged;
}

export function createItemInputFromDraft(
  draft: DraftItem
): TaskItemCreateInput {
  const quantity = parseQuantity(draft.quantity) ?? QUANTITY_MIN;
  const handler = toOptionalTrimmed(draft.handler);
  const pin =
    draft.pin?.areaId && draft.pin.floorId
      ? {
          areaId: draft.pin.areaId,
          floorId: draft.pin.floorId,
          source: draft.pin.source,
          target: draft.pin.target,
        }
      : undefined;

  return {
    name: draft.name.trim(),
    quantity,
    sourceName: draft.sourceName.trim(),
    targetName: draft.targetName.trim(),
    status: draft.status,
    ...(handler ? { handler } : {}),
    ...(pin ? { pin } : {}),
  } satisfies TaskItemCreateInput;
}
