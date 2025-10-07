import { del, get, set } from "idb-keyval";
import { blobToDataUrl, dataUrlToBlob } from "@/lib/utils/blob";
import type { EntityId, ItemPhoto } from "@/types/app";

import { readJson, writeJson } from "../storage";

const META_STORAGE_KEY = "mvp_item_photos";
const BLOB_KEY_PREFIX = "mvp_item_photo_blob:";
const DEFAULT_DELAY_MS = 120;

function delay(ms = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isBrowserEnvironment(): boolean {
  return typeof window !== "undefined";
}

function getBlobKey(id: EntityId): string {
  return `${BLOB_KEY_PREFIX}${id}`;
}

async function readMetadataList(): Promise<ItemPhoto[]> {
  return (await readJson<ItemPhoto[]>(META_STORAGE_KEY)) ?? [];
}

async function writeMetadataList(list: ItemPhoto[]): Promise<void> {
  await writeJson(META_STORAGE_KEY, list);
}

async function upsertMetadata(photo: ItemPhoto): Promise<void> {
  const current = await readMetadataList();
  const filtered = current.filter((entry) => entry.id !== photo.id);
  const next = [photo, ...filtered];
  await writeMetadataList(next);
}

async function updateMetadata(
  id: EntityId,
  patch: Partial<ItemPhoto>
): Promise<ItemPhoto | null> {
  const list = await readMetadataList();
  const index = list.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return null;
  }

  const updated: ItemPhoto = { ...list[index], ...patch };
  const next = [...list.slice(0, index), updated, ...list.slice(index + 1)];
  await writeMetadataList(next);
  return updated;
}

async function removeBlob(id: EntityId): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }
  await del(getBlobKey(id));
}

async function writeBlob(id: EntityId, blob: Blob): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }
  await set(getBlobKey(id), blob);
}

function sortByCreatedAtDesc(a: ItemPhoto, b: ItemPhoto): number {
  if (a.createdAt === b.createdAt) {
    return 0;
  }
  return a.createdAt < b.createdAt ? 1 : -1;
}

export type PhotoSeed = {
  metadata: ItemPhoto;
  dataUrl?: string;
};

export type PhotoCreateInput = {
  id: EntityId;
  itemId: EntityId;
  blob: Blob;
  fileName?: string;
  mimeType: string;
  note?: string;
  createdAt: string;
};

export const PhotoRepository = {
  async listByItem(itemId: EntityId): Promise<ItemPhoto[]> {
    await delay();
    const list = await readMetadataList();
    return list
      .filter((photo) => photo.itemId === itemId)
      .sort(sortByCreatedAtDesc);
  },
  async get(id: EntityId): Promise<ItemPhoto | null> {
    await delay();
    const list = await readMetadataList();
    return list.find((photo) => photo.id === id) ?? null;
  },
  async create(input: PhotoCreateInput): Promise<ItemPhoto> {
    if (!isBrowserEnvironment()) {
      throw new Error("PHOTO_STORAGE_UNAVAILABLE");
    }

    await delay();

    const mimeType = input.mimeType || input.blob.type || "image/jpeg";
    const createdAt = input.createdAt;
    const metadata: ItemPhoto = {
      id: input.id,
      itemId: input.itemId,
      fileName: input.fileName,
      mimeType,
      size: input.blob.size,
      createdAt,
      note: input.note,
      hasBlob: true,
    } satisfies ItemPhoto;

    const previewDataUrl = await blobToDataUrl(input.blob);
    metadata.previewDataUrl = previewDataUrl;

    await writeBlob(metadata.id, input.blob);
    await upsertMetadata(metadata);
    return metadata;
  },
  async getDataUrl(id: EntityId): Promise<string | null> {
    await delay();
    const metadataList = await readMetadataList();
    const metadata = metadataList.find((photo) => photo.id === id);
    if (!metadata) {
      return null;
    }

    if (metadata.previewDataUrl) {
      return metadata.previewDataUrl;
    }

    if (!metadata.hasBlob) {
      return metadata.previewDataUrl ?? null;
    }

    if (!isBrowserEnvironment()) {
      return metadata.previewDataUrl ?? null;
    }

    const blob = await get(getBlobKey(id));
    if (!(blob instanceof Blob)) {
      return metadata.previewDataUrl ?? null;
    }

    const dataUrl = await blobToDataUrl(blob);
    await updateMetadata(id, { previewDataUrl: dataUrl });
    return dataUrl;
  },
  async delete(id: EntityId): Promise<boolean> {
    await delay();
    const list = await readMetadataList();
    const filtered = list.filter((photo) => photo.id !== id);
    if (filtered.length === list.length) {
      return false;
    }
    await writeMetadataList(filtered);
    await removeBlob(id);
    return true;
  },
  async setAll(entries: PhotoSeed[]): Promise<void> {
    const metadataList = entries
      .map((entry) => entry.metadata)
      .sort(sortByCreatedAtDesc);
    await writeMetadataList(metadataList);

    if (!isBrowserEnvironment()) {
      return;
    }

    await Promise.all(
      entries.map(async (entry) => {
        if (entry.dataUrl) {
          const blob = dataUrlToBlob(entry.dataUrl);
          await writeBlob(entry.metadata.id, blob);
        } else {
          await removeBlob(entry.metadata.id);
        }
      })
    );
  },
};
