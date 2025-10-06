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
