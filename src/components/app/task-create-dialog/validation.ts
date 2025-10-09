import { QUANTITY_MIN } from "./constants";
import type {
  DraftItem,
  DraftItemErrorMap,
  DraftItemFieldError,
  DraftValidationResult,
} from "./types";
import { parseQuantity } from "./utils";

const ERROR_MESSAGES = {
  noItems: "物品を1件以上追加してください",
  invalidDraft: "各物品の入力内容を確認してください",
  missingPin: "位置情報が未設定の物品があります",
  requireName: "物品名を入力してください",
  requireQuantity: `数量は${QUANTITY_MIN}以上の整数で入力してください`,
  requireSource: "借用元を入力してください",
  requireTarget: "移動先を入力してください",
  requirePin: "エリアと移動先の位置情報を設定してください",
} as const;

export function validateDraftItems(drafts: DraftItem[]): DraftValidationResult {
  if (drafts.length === 0) {
    return {
      isValid: false,
      errors: {},
      message: ERROR_MESSAGES.noItems,
    };
  }

  const errors: DraftItemErrorMap = {};

  for (const draft of drafts) {
    const fieldErrors: DraftItemFieldError = {};

    if (!draft.name.trim()) {
      fieldErrors.name = ERROR_MESSAGES.requireName;
    }

    const quantity = parseQuantity(draft.quantity);
    if (quantity === null || quantity < QUANTITY_MIN) {
      fieldErrors.quantity = ERROR_MESSAGES.requireQuantity;
    }

    if (!draft.sourceName.trim()) {
      fieldErrors.sourceName = ERROR_MESSAGES.requireSource;
    }

    if (!draft.targetName.trim()) {
      fieldErrors.targetName = ERROR_MESSAGES.requireTarget;
    }

    if (Object.keys(fieldErrors).length > 0) {
      errors[draft.id] = fieldErrors;
    }
  }

  const hasError = Object.keys(errors).length > 0;
  return {
    isValid: !hasError,
    errors,
    message: hasError ? ERROR_MESSAGES.invalidDraft : null,
  };
}

export function validateDraftPins(drafts: DraftItem[]): DraftValidationResult {
  const errors: DraftItemErrorMap = {};

  for (const draft of drafts) {
    const hasTarget = Boolean(
      draft.pin?.areaId && draft.pin.floorId && draft.pin.target
    );

    if (!hasTarget) {
      errors[draft.id] = {
        pin: ERROR_MESSAGES.requirePin,
      };
    }
  }

  const hasError = Object.keys(errors).length > 0;
  return {
    isValid: !hasError,
    errors,
    message: hasError ? ERROR_MESSAGES.missingPin : null,
  };
}
