import type { ItemStatus, TaskStatus } from "@/types/app";

type StatusCarrier = {
  status: ItemStatus;
};

export function deriveTaskStatusFromItems(
  items: Iterable<StatusCarrier>
): TaskStatus {
  let count = 0;
  let hasIssue = false;
  let hasProgress = false;
  let allPlaced = true;

  for (const item of items) {
    count += 1;

    if (item.status === "issue") {
      hasIssue = true;
    }

    if (item.status !== "placed") {
      allPlaced = false;
    }

    if (item.status === "moving" || item.status === "placed") {
      hasProgress = true;
    }
  }

  if (count === 0) {
    return "not_started";
  }

  if (allPlaced) {
    return "done";
  }

  if (hasIssue || hasProgress) {
    return "in_progress";
  }

  return "not_started";
}
