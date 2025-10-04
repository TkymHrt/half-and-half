'use client';

import { AppHeader } from '@/components/app/header';
import { TaskCreateDialog } from '@/components/app/task-create-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaRepo, ItemRepo } from '@/lib/mock';
import { useAppStore } from '@/lib/store/app-store';
import { type Area, type Floor, type Item } from '@/types/app';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

// Dynamically import the FloorMap component to ensure it's only loaded on the client side.
const FloorMap = dynamic(
  () => import('@/components/app/map/floor-map').then((mod) => mod.FloorMap),
  {
    ssr: false,
    loading: () => <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center bg-muted rounded-md"><p>マップを読み込んでいます...</p></div>,
  }
);

export default function MapPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTitle } = useAppStore();

  useEffect(() => {
    setTitle('マップ');
    async function fetchData() {
      setLoading(true);
      const [areaData, itemData] = await Promise.all([AreaRepo.list(), ItemRepo.list()]);
      setAreas(areaData);
      setItems(itemData);
      if (areaData.length > 0) {
        setSelectedAreaId(areaData[0].id);
        if (areaData[0].floors.length > 0) {
          setSelectedFloorId(areaData[0].floors[0].id);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [setTitle]);

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === selectedAreaId),
    [areas, selectedAreaId]
  );

  const selectedFloor = useMemo(
    () => selectedArea?.floors.find((f) => f.id === selectedFloorId),
    [selectedArea, selectedFloorId]
  );

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    const newArea = areas.find((a) => a.id === areaId);
    if (newArea && newArea.floors.length > 0) {
      setSelectedFloorId(newArea.floors[0].id);
    } else {
      setSelectedFloorId(null);
    }
  };

  return (
    <div>
      <AppHeader action={<TaskCreateDialog />} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select value={selectedAreaId ?? ''} onValueChange={handleAreaChange}>
            <SelectTrigger>
              <SelectValue placeholder="エリアを選択" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedFloorId ?? ''}
            onValueChange={setSelectedFloorId}
            disabled={!selectedArea}
          >
            <SelectTrigger>
              <SelectValue placeholder="フロアを選択" />
            </SelectTrigger>
            <SelectContent>
              {selectedArea?.floors.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          {selectedFloor ? (
            <FloorMap floor={selectedFloor} items={items} />
          ) : (
            <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center bg-muted rounded-md">
              <p>表示するフロアを選択してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}