"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { ItemStatusSelect } from "@/components/app/item-status-select";
import { addItemPhoto } from "@/lib/application/activity";
import { PhotoRepository } from "@/lib/mock/repositories/photos";
import {
  createMapHref,
  ITEM_STATUS_BADGE_CLASS,
} from "@/lib/presentation/items";
import { getItemStatusLabel } from "@/lib/presentation/status";
import { cn } from "@/lib/utils";
import type { Item, ItemPhoto, ItemStatus } from "@/types/app";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

const BYTE_FACTOR = 2 ** 10;
const BYTES_PER_KILOBYTE = BYTE_FACTOR;

export type ItemDetailDrawerProps = {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeStatus: (item: Item, status: ItemStatus) => void;
  onItemUpdated: (item: Item) => void;
  actor?: string | null;
  isStatusUpdating: boolean;
};

type MapLinks = {
  sourceHref?: string | null;
  targetHref?: string | null;
};

type PhotoPreview = {
  metadata: ItemPhoto;
  dataUrl: string | null;
};

export function ItemDetailDrawer({
  item,
  open,
  onOpenChange,
  onChangeStatus,
  onItemUpdated,
  actor,
  isStatusUpdating,
}: ItemDetailDrawerProps) {
  const inputId = useId();
  const {
    photoEntries,
    setPhotoEntries,
    photoError,
    setPhotoError,
    isLoadingPhotos,
  } = useItemPhotoPreviews(item, open);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0];
      event.target.value = "";
      if (!nextFile) {
        return;
      }

      const targetItem = item;
      if (!targetItem) {
        return;
      }

      setIsUploading(true);
      setPhotoError(null);

      try {
        const result = await addItemPhoto({
          item: targetItem,
          blob: nextFile,
          fileName: nextFile.name,
          actor: actor ?? undefined,
        });

        onItemUpdated(result.item);
        const dataUrl =
          result.photo.previewDataUrl ??
          (await PhotoRepository.getDataUrl(result.photo.id));

        setPhotoEntries((previous) => [
          {
            metadata: result.photo,
            dataUrl,
          },
          ...previous.filter((entry) => entry.metadata.id !== result.photo.id),
        ]);

        toast.success("写真を登録しました");
      } catch {
        setPhotoError("写真の保存に失敗しました。時間をおいてお試しください。");
        toast.error("写真の保存に失敗しました");
      } finally {
        setIsUploading(false);
      }
    },
    [actor, item, onItemUpdated, setPhotoEntries, setPhotoError]
  );

  const mapLinks = useMemo<MapLinks | null>(() => {
    if (!item) {
      return null;
    }

    return {
      sourceHref: createMapHref(item, "source"),
      targetHref: createMapHref(item, "target"),
    } satisfies MapLinks;
  }, [item]);

  const badgeClass = item ? ITEM_STATUS_BADGE_CLASS[item.status] : undefined;

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="p-0">
        <DrawerHeader className="px-4">
          <DrawerTitle>{item ? item.name : "物品詳細"}</DrawerTitle>
          <DrawerDescription>
            {item
              ? `数量 ${item.quantity} / 担当 ${item.handler ?? "未設定"}`
              : "詳細情報を表示します"}
          </DrawerDescription>
        </DrawerHeader>

        <Separator />

        <div className="space-y-6 px-4 py-4">
          <ItemSummarySection
            badgeClass={badgeClass ?? ""}
            isStatusUpdating={isStatusUpdating}
            item={item}
            mapLinks={mapLinks}
            onChangeStatus={onChangeStatus}
          />

          <PhotoUploadSection
            disabled={isUploading || !item}
            errorMessage={photoError}
            inputId={inputId}
            isUploading={isUploading}
            onChange={handleFileChange}
          />

          <PhotoListSection
            entries={photoEntries}
            isLoading={isLoadingPhotos}
            itemName={item?.name}
          />
        </div>

        <DrawerFooter className="px-4 pb-4">
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              閉じる
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ItemSummarySection({
  item,
  mapLinks,
  badgeClass,
  isStatusUpdating,
  onChangeStatus,
}: {
  item: Item | null;
  mapLinks: MapLinks | null;
  badgeClass: string;
  isStatusUpdating: boolean;
  onChangeStatus: (item: Item, status: ItemStatus) => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <section aria-label="物品の基本情報" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn("text-xs", badgeClass)} variant="outline">
          {getItemStatusLabel(item.status)}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">ステータス</p>
        <ItemStatusSelect
          aria-label={`${item.name}のステータスを変更`}
          disabled={isStatusUpdating}
          onChange={(status) => onChangeStatus(item, status)}
          triggerClassName="w-[180px]"
          value={item.status}
        />
        {isStatusUpdating ? (
          <span className="text-muted-foreground text-xs">更新中...</span>
        ) : null}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground text-xs">借用元</dt>
          <dd className="mt-1">
            {mapLinks?.sourceHref ? (
              <Link
                className="text-primary text-sm underline-offset-4 hover:underline"
                href={mapLinks.sourceHref}
              >
                {item.sourceName}
              </Link>
            ) : (
              <span className="text-sm">{item.sourceName}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">移動先</dt>
          <dd className="mt-1">
            {mapLinks?.targetHref ? (
              <Link
                className="text-primary text-sm underline-offset-4 hover:underline"
                href={mapLinks.targetHref}
              >
                {item.targetName}
              </Link>
            ) : (
              <span className="text-sm">{item.targetName}</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function PhotoUploadSection({
  inputId,
  isUploading,
  errorMessage,
  onChange,
  disabled,
}: {
  inputId: string;
  isUploading: boolean;
  errorMessage: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <section aria-label="写真を登録" className="space-y-3">
      <div>
        <Label htmlFor={inputId}>配置完了の写真を添付</Label>
        <p className="text-muted-foreground text-xs">
          カメラで撮影するか、端末に保存された画像を選択してください。
        </p>
      </div>
      <Input
        accept="image/*"
        capture="environment"
        disabled={disabled}
        id={inputId}
        onChange={onChange}
        type="file"
      />
      {isUploading ? (
        <p className="text-muted-foreground text-xs">アップロード中...</p>
      ) : null}
      {errorMessage ? (
        <p className="text-destructive text-sm" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}

function PhotoListSection({
  entries,
  isLoading,
  itemName,
}: {
  entries: PhotoPreview[];
  isLoading: boolean;
  itemName?: string;
}) {
  const title = itemName ?? "物品";

  return (
    <section aria-label="登録済みの写真">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">登録済みの写真</h3>
        <span className="text-muted-foreground text-xs">
          {entries.length} 件
        </span>
      </div>
      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
        ) : null}

        {!isLoading && entries.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
            まだ写真は登録されていません。
          </p>
        ) : null}

        {entries.length > 0 ? (
          <ScrollArea className="h-[17rem] pr-3">
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li key={entry.metadata.id}>
                  <article className="rounded-lg border bg-card shadow-sm">
                    {entry.dataUrl ? (
                      <Image
                        alt={`${title}の写真`}
                        className="h-48 w-full rounded-t-lg object-cover"
                        height={320}
                        sizes="(max-width: 640px) 100vw, 320px"
                        src={entry.dataUrl}
                        unoptimized
                        width={320}
                      />
                    ) : (
                      <div className="grid h-48 place-items-center rounded-t-lg bg-muted text-muted-foreground text-sm">
                        プレビューを表示できません
                      </div>
                    )}
                    <div className="space-y-2 px-4 py-3">
                      <p className="font-medium text-sm">
                        {entry.metadata.fileName ?? "写真"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatTimestamp(entry.metadata.createdAt)} /{" "}
                        {formatFileSize(entry.metadata.size)}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : null}
      </div>
    </section>
  );
}

function useItemPhotoPreviews(item: Item | null, open: boolean) {
  const [entries, setEntries] = useState<PhotoPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntries([]);
      setError(null);
      return;
    }

    if (!item) {
      return;
    }

    const targetItem = item;
    let isActive = true;

    async function fetchPhotos() {
      setIsLoading(true);
      setError(null);
      try {
        const photos = await PhotoRepository.listByItem(targetItem.id);
        const previews = await Promise.all(
          photos.map(async (metadata) => {
            const dataUrl = await PhotoRepository.getDataUrl(metadata.id);
            return {
              metadata,
              dataUrl,
            } satisfies PhotoPreview;
          })
        );

        if (!isActive) {
          return;
        }

        setEntries(previews);
      } catch {
        if (!isActive) {
          return;
        }
        setError("写真の読み込みに失敗しました。");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchPhotos();

    return () => {
      isActive = false;
    };
  }, [item, open]);

  return {
    photoEntries: entries,
    setPhotoEntries: setEntries,
    photoError: error,
    setPhotoError: setError,
    isLoadingPhotos: isLoading,
  };
}

function formatTimestamp(value: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "short",
      timeStyle: "short",
    });
    return formatter.format(new Date(value));
  } catch {
    return value;
  }
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return "サイズ情報なし";
  }

  if (size < BYTES_PER_KILOBYTE) {
    return `${size} B`;
  }

  const kiloBytes = size / BYTES_PER_KILOBYTE;
  if (kiloBytes < BYTE_FACTOR) {
    return `${kiloBytes.toFixed(1)} KB`;
  }

  const megaBytes = kiloBytes / BYTE_FACTOR;
  if (megaBytes < BYTE_FACTOR) {
    return `${megaBytes.toFixed(1)} MB`;
  }

  const gigaBytes = megaBytes / BYTE_FACTOR;
  return `${gigaBytes.toFixed(1)} GB`;
}
