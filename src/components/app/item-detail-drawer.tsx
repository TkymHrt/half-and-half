'use client';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { type Item } from '@/types/app';
import { Camera } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { v4 as uuid } from 'uuid';
import { ItemRepo, LogRepo } from '@/lib/mock';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export function ItemDetailDrawer({ item, children }: { item: Item; children: React.ReactNode }) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // When the drawer is opened, check for an existing photo and create a URL for preview
    if (item.photoIds && item.photoIds.length > 0) {
      const latestPhotoId = item.photoIds[item.photoIds.length - 1];
      get(latestPhotoId).then((file) => {
        if (file instanceof File) {
          setPhotoPreview(URL.createObjectURL(file));
        }
      });
    } else {
      setPhotoPreview(null);
    }
  }, [item.photoIds]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const photoId = uuid();

      // Store the file in IndexedDB
      await set(photoId, file);

      // Update the item with the new photo ID
      const updatedPhotoIds = [...(item.photoIds || []), photoId];
      await ItemRepo.update(item.id, { photoIds: updatedPhotoIds });

      // Create a log event
      await LogRepo.create({
        actor: 'ユーザー', // This would be the current user in a real app
        type: 'item_photo_uploaded',
        payload: {
          itemId: item.id,
          itemName: item.name,
          photoId,
        },
      });

      // Update the preview
      setPhotoPreview(URL.createObjectURL(file));

    } catch (error) {
      console.error('Failed to upload photo:', error);
      // Handle error display to the user if necessary
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{item.name}</DrawerTitle>
            <DrawerDescription>
              {item.sourceName} → {item.targetName}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="space-y-4">
              <div className="h-48 w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Photo preview"
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">写真プレビュー</p>
                )}
              </div>
              <div className="flex justify-center">
                <Button asChild disabled={isUploading}>
                  <label htmlFor={`file-upload-${item.id}`}>
                    <Camera className="mr-2 h-4 w-4" />
                    {isUploading ? 'アップロード中...' : '写真を添付'}
                    <input
                      id={`file-upload-${item.id}`}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4">
            <Button variant="outline" className="w-full">
              配置完了報告
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}