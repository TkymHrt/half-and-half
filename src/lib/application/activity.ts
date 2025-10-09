import { deriveTaskStatusFromItems } from "@/lib/application/task-progress";
import { ItemRepository } from "@/lib/mock/repositories/items";
import { LogRepository } from "@/lib/mock/repositories/logs";
import { PhotoRepository } from "@/lib/mock/repositories/photos";
import { TaskRepository } from "@/lib/mock/repositories/tasks";
import type {
  EntityId,
  Item,
  ItemPhoto,
  ItemStatus,
  LogEvent,
  Task,
  TaskStatus,
} from "@/types/app";

const DEFAULT_ACTOR = "運営本部";
const ITEM_ID_PREFIX = "item-";
const LOG_ID_PREFIX = "log-";
const PHOTO_ID_PREFIX = "photo-";
const ID_RADIX = 36;
let sequence = 0;

function createPrefixedId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}${crypto.randomUUID()}`;
  }

  sequence = (sequence + 1) % Number.MAX_SAFE_INTEGER;
  const base = Date.now() + sequence;
  return `${prefix}${base.toString(ID_RADIX)}`;
}

export function generateItemId(): EntityId {
  return createPrefixedId(ITEM_ID_PREFIX);
}

export function generateLogId(): EntityId {
  return createPrefixedId(LOG_ID_PREFIX);
}

export function generatePhotoId(): EntityId {
  return createPrefixedId(PHOTO_ID_PREFIX);
}

export type TaskItemCreateInput = {
  name: string;
  quantity: number;
  sourceName: string;
  targetName: string;
  status: ItemStatus;
  handler?: string;
  pin?: Item["pin"];
};

export type CreateTaskWithItemsInput = {
  title: string;
  description?: string;
  handler?: string;
  actor?: string;
  items: TaskItemCreateInput[];
};

export type CreateTaskWithItemsResult = {
  task: Task;
  items: Item[];
  logs: LogEvent[];
  taskStatus: TaskStatus;
};

type UpdateItemStatusInput = {
  item: Item;
  nextStatus: ItemStatus;
  items: Item[];
  taskId: EntityId;
  actor?: string;
};

export type UpdateItemStatusResult = {
  item: Item;
  items: Item[];
  task: Task | null;
  taskStatus: TaskStatus;
  log: LogEvent;
};

export type AddItemPhotoInput = {
  item: Item;
  blob: Blob;
  fileName?: string;
  note?: string;
  actor?: string;
};

export type AddItemPhotoResult = {
  photo: ItemPhoto;
  item: Item;
  log: LogEvent;
};

type UpdateTaskStatusInput = {
  task: Task;
  nextStatus: TaskStatus;
  actor?: string;
};

export type UpdateTaskStatusResult = {
  task: Task;
  log: LogEvent;
};

function resolveActor(candidate?: string | null): string {
  const normalized = candidate?.trim();
  if (normalized) {
    return normalized;
  }
  return DEFAULT_ACTOR;
}

async function persistLogsSequential(logs: LogEvent[]): Promise<void> {
  for (const log of logs) {
    await LogRepository.add(log);
  }
}

export async function createTaskWithItems(
  input: CreateTaskWithItemsInput
): Promise<CreateTaskWithItemsResult> {
  const actor = resolveActor(input.actor ?? input.handler);
  const task = await TaskRepository.create({
    title: input.title,
    description: input.description,
    handler: input.handler,
  });

  const createdItems: Item[] = input.items.map((item) => ({
    id: generateItemId(),
    taskId: task.id,
    name: item.name,
    quantity: item.quantity,
    sourceName: item.sourceName,
    targetName: item.targetName,
    status: item.status,
    ...(item.handler ? { handler: item.handler } : {}),
    ...(item.pin ? { pin: item.pin } : {}),
    photoIds: [],
  }));

  await ItemRepository.createMany(createdItems);

  const derivedStatus = deriveTaskStatusFromItems(createdItems);
  const itemIds = createdItems.map((entity) => entity.id);
  const updatedTask = (await TaskRepository.update(task.id, {
    itemIds,
    status: derivedStatus,
  })) ?? {
    ...task,
    itemIds,
    status: derivedStatus,
  };

  const timestamp = new Date().toISOString();
  const logs: LogEvent[] = [
    {
      id: generateLogId(),
      at: timestamp,
      actor,
      type: "task_created",
      payload: {
        taskId: updatedTask.id,
        title: updatedTask.title,
        itemIds,
      },
    },
    ...createdItems.map(
      (item) =>
        ({
          id: generateLogId(),
          at: timestamp,
          actor,
          type: "item_added",
          payload: {
            taskId: updatedTask.id,
            itemId: item.id,
            name: item.name,
            quantity: item.quantity,
          },
        }) satisfies LogEvent
    ),
  ];

  await persistLogsSequential(logs);

  return {
    task: updatedTask,
    items: createdItems,
    logs,
    taskStatus: derivedStatus,
  };
}

export async function addItemPhoto(
  input: AddItemPhotoInput
): Promise<AddItemPhotoResult> {
  const actor = resolveActor(input.actor ?? input.item.handler);
  const photoId = generatePhotoId();
  const timestamp = new Date().toISOString();

  const photoMetadata = await PhotoRepository.create({
    id: photoId,
    itemId: input.item.id,
    blob: input.blob,
    fileName: input.fileName,
    mimeType: input.blob.type || "image/jpeg",
    note: input.note,
    createdAt: timestamp,
  });

  const previousPhotoIds = input.item.photoIds ?? [];
  const photoIds = [photoMetadata.id, ...previousPhotoIds];
  const updatedItem = (await ItemRepository.update(input.item.id, {
    photoIds,
  })) ?? {
    ...input.item,
    photoIds,
  };

  const log: LogEvent = {
    id: generateLogId(),
    at: timestamp,
    actor,
    type: "item_photo_uploaded",
    payload: {
      itemId: updatedItem.id,
      photoId: photoMetadata.id,
      fileName: photoMetadata.fileName,
    },
  } satisfies LogEvent;

  await LogRepository.add(log);

  return {
    photo: photoMetadata,
    item: updatedItem,
    log,
  } satisfies AddItemPhotoResult;
}

export async function updateItemStatusWithLog(
  input: UpdateItemStatusInput
): Promise<UpdateItemStatusResult> {
  const actor = resolveActor(input.actor);
  const updatedItem = await ItemRepository.update(input.item.id, {
    status: input.nextStatus,
  });

  if (!updatedItem) {
    throw new Error("ITEM_UPDATE_FAILED");
  }

  const nextItems = input.items.some(
    (candidate) => candidate.id === updatedItem.id
  )
    ? input.items.map((candidate) =>
        candidate.id === updatedItem.id ? updatedItem : candidate
      )
    : [updatedItem, ...input.items];

  const derivedStatus = deriveTaskStatusFromItems(nextItems);
  const updatedTask =
    (await TaskRepository.update(input.taskId, {
      status: derivedStatus,
    })) ?? null;

  const log: LogEvent = {
    id: generateLogId(),
    at: new Date().toISOString(),
    actor,
    type: "item_status_changed",
    payload: {
      itemId: updatedItem.id,
      taskId: input.taskId,
      status: input.nextStatus,
      previousStatus: input.item.status,
    },
  };

  await LogRepository.add(log);

  return {
    item: updatedItem,
    items: nextItems,
    task: updatedTask,
    taskStatus: derivedStatus,
    log,
  };
}

export async function updateTaskStatusWithLog(
  input: UpdateTaskStatusInput
): Promise<UpdateTaskStatusResult> {
  const actor = resolveActor(input.actor ?? input.task.handler);
  const updatedTask = await TaskRepository.update(input.task.id, {
    status: input.nextStatus,
  });

  if (!updatedTask) {
    throw new Error("TASK_UPDATE_FAILED");
  }

  const log: LogEvent = {
    id: generateLogId(),
    at: new Date().toISOString(),
    actor,
    type: "task_status_changed",
    payload: {
      taskId: updatedTask.id,
      status: input.nextStatus,
      previousStatus: input.task.status,
    },
  } satisfies LogEvent;

  await LogRepository.add(log);

  return {
    task: updatedTask,
    log,
  } satisfies UpdateTaskStatusResult;
}

export type UpdateTaskInput = {
  task: Task;
  title?: string;
  description?: string | null;
  handler?: string | null;
  actor?: string;
};

export type UpdateTaskResult = {
  task: Task;
  log: LogEvent;
};

export async function updateTaskWithLog(
  input: UpdateTaskInput
): Promise<UpdateTaskResult> {
  const actor = resolveActor(input.actor ?? input.task.handler);
  const changes: Partial<Task> = {};

  if (input.title !== undefined) {
    changes.title = input.title;
  }
  if (input.description !== undefined) {
    changes.description = input.description ?? undefined;
  }
  if (input.handler !== undefined) {
    changes.handler = input.handler ?? undefined;
  }

  const updatedTask = await TaskRepository.update(input.task.id, changes);

  if (!updatedTask) {
    throw new Error("TASK_UPDATE_FAILED");
  }

  const log: LogEvent = {
    id: generateLogId(),
    at: new Date().toISOString(),
    actor,
    type: "task_updated",
    payload: {
      taskId: updatedTask.id,
      changes,
    },
  } satisfies LogEvent;

  await LogRepository.add(log);

  return {
    task: updatedTask,
    log,
  } satisfies UpdateTaskResult;
}

export type UpdateItemInput = {
  item: Item;
  name?: string;
  quantity?: number;
  sourceName?: string;
  targetName?: string;
  handler?: string | null;
  pin?: Item["pin"];
  actor?: string;
};

export type UpdateItemResult = {
  item: Item;
  log: LogEvent;
};

export async function updateItemWithLog(
  input: UpdateItemInput
): Promise<UpdateItemResult> {
  const actor = resolveActor(input.actor ?? input.item.handler);
  const changes: Partial<Item> = {};

  if (input.name !== undefined) {
    changes.name = input.name;
  }
  if (input.quantity !== undefined) {
    changes.quantity = input.quantity;
  }
  if (input.sourceName !== undefined) {
    changes.sourceName = input.sourceName;
  }
  if (input.targetName !== undefined) {
    changes.targetName = input.targetName;
  }
  if (input.handler !== undefined) {
    changes.handler = input.handler ?? undefined;
  }
  if (input.pin !== undefined) {
    changes.pin = input.pin;
  }

  const updatedItem = await ItemRepository.update(input.item.id, changes);

  if (!updatedItem) {
    throw new Error("ITEM_UPDATE_FAILED");
  }

  const log: LogEvent = {
    id: generateLogId(),
    at: new Date().toISOString(),
    actor,
    type: "item_updated",
    payload: {
      itemId: updatedItem.id,
      taskId: input.item.taskId,
      changes,
    },
  } satisfies LogEvent;

  await LogRepository.add(log);

  return {
    item: updatedItem,
    log,
  } satisfies UpdateItemResult;
}

export type DeleteItemInput = {
  item: Item;
  items: Item[];
  taskId: EntityId;
  actor?: string;
};

export type DeleteItemResult = {
  itemId: EntityId;
  items: Item[];
  task: Task | null;
  taskStatus: TaskStatus;
  log: LogEvent;
};

export async function deleteItemWithLog(
  input: DeleteItemInput
): Promise<DeleteItemResult> {
  const actor = resolveActor(input.actor ?? input.item.handler);

  // 写真を削除
  if (input.item.photoIds?.length) {
    for (const photoId of input.item.photoIds) {
      await PhotoRepository.delete(photoId);
    }
  }

  // アイテムを削除
  await ItemRepository.delete(input.item.id);

  // タスクのitemIdsを更新
  const task = await TaskRepository.get(input.taskId);
  if (task) {
    const updatedItemIds = task.itemIds.filter(
      (id: EntityId) => id !== input.item.id
    );
    await TaskRepository.update(input.taskId, { itemIds: updatedItemIds });
  }

  // 残りのアイテムでタスクステータスを再計算
  const remainingItems = input.items.filter((i) => i.id !== input.item.id);
  const derivedStatus = deriveTaskStatusFromItems(remainingItems);
  const updatedTask =
    (await TaskRepository.update(input.taskId, {
      status: derivedStatus,
    })) ?? null;

  const log: LogEvent = {
    id: generateLogId(),
    at: new Date().toISOString(),
    actor,
    type: "item_deleted",
    payload: {
      itemId: input.item.id,
      taskId: input.taskId,
      name: input.item.name,
      quantity: input.item.quantity,
    },
  } satisfies LogEvent;

  await LogRepository.add(log);

  return {
    itemId: input.item.id,
    items: remainingItems,
    task: updatedTask,
    taskStatus: derivedStatus,
    log,
  };
}

export type DeleteTaskInput = {
  task: Task;
  actor?: string;
};

export type DeleteTaskResult = {
  taskId: EntityId;
  log: LogEvent;
};

export async function deleteTaskWithLog(
  input: DeleteTaskInput
): Promise<DeleteTaskResult> {
  const actor = resolveActor(input.actor ?? input.task.handler);

  // タスクに紐づくアイテムを取得
  const items = await ItemRepository.list({ taskId: input.task.id });

  // 各アイテムの写真とアイテム自体を削除
  for (const item of items) {
    if (item.photoIds?.length) {
      for (const photoId of item.photoIds) {
        await PhotoRepository.delete(photoId);
      }
    }
    await ItemRepository.delete(item.id);
  }

  // タスクを削除
  await TaskRepository.delete(input.task.id);

  const log: LogEvent = {
    id: generateLogId(),
    at: new Date().toISOString(),
    actor,
    type: "task_deleted",
    payload: {
      taskId: input.task.id,
      title: input.task.title,
      itemCount: items.length,
    },
  } satisfies LogEvent;

  await LogRepository.add(log);

  return {
    taskId: input.task.id,
    log,
  };
}
