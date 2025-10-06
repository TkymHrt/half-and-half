import { useCallback, useMemo, useState } from "react";
import type { ItemStatus, RelativePoint } from "@/types/app";
import type { DraftItem } from "./types";
import { createInitialDraft } from "./utils";

export type TaskDraftState = {
  items: DraftItem[];
  selectedItemId: string | null;
  selectedItem: DraftItem | undefined;
  selectItem: (id: string) => void;
  addItem: () => void;
  addMultipleItems: (count: number) => void;
  removeItem: (id: string) => void;
  updateItemFields: (id: string, patch: Partial<DraftItem>) => void;
  updateStatus: (id: string, status: ItemStatus) => void;
  setArea: (id: string, areaId: string | null) => void;
  setFloor: (id: string, floorId: string | null) => void;
  setPinPoint: (
    id: string,
    kind: "source" | "target",
    point: RelativePoint
  ) => void;
  reset: () => void;
};

export function useTaskDrafts(): TaskDraftState {
  const [items, setItems] = useState<DraftItem[]>(() => [createInitialDraft()]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    items[0]?.id ?? null
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId),
    [items, selectedItemId]
  );

  const selectItem = useCallback((id: string) => {
    setSelectedItemId(id);
  }, []);

  const addItem = useCallback(() => {
    setItems((previous) => {
      const nextItems = [...previous, createInitialDraft()];
      const created = nextItems.at(-1);
      if (created) {
        setSelectedItemId(created.id);
      }
      return nextItems;
    });
  }, []);

  const addMultipleItems = useCallback((count: number) => {
    setItems((previous) => {
      const newItems = Array.from({ length: count }, () =>
        createInitialDraft()
      );
      const nextItems = [...previous, ...newItems];
      const lastCreated = nextItems.at(-1);
      if (lastCreated) {
        setSelectedItemId(lastCreated.id);
      }
      return nextItems;
    });
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      setItems((previous) => {
        if (previous.length <= 1) {
          return previous;
        }

        const nextItems = previous.filter((item) => item.id !== id);
        if (selectedItemId === id) {
          setSelectedItemId(nextItems.at(0)?.id ?? null);
        }
        return nextItems;
      });
    },
    [selectedItemId]
  );

  const updateItem = useCallback(
    (id: string, updater: (item: DraftItem) => DraftItem) => {
      setItems((previous) =>
        previous.map((item) => (item.id === id ? updater(item) : item))
      );
    },
    []
  );

  const updateItemFields = useCallback(
    (id: string, patch: Partial<DraftItem>) => {
      updateItem(id, (item) => ({ ...item, ...patch }));
    },
    [updateItem]
  );

  const updateStatus = useCallback(
    (id: string, status: ItemStatus) => {
      updateItemFields(id, { status });
    },
    [updateItemFields]
  );

  const setArea = useCallback(
    (id: string, areaId: string | null) => {
      updateItem(id, (item) => {
        if (!areaId) {
          return {
            ...item,
            pin: undefined,
          } satisfies DraftItem;
        }

        const nextPin = item.pin?.areaId === areaId ? item.pin : undefined;
        return {
          ...item,
          pin: {
            areaId,
            floorId: nextPin?.floorId,
            source: nextPin?.source,
            target: nextPin?.target,
          },
        } satisfies DraftItem;
      });
    },
    [updateItem]
  );

  const setFloor = useCallback(
    (id: string, floorId: string | null) => {
      updateItem(id, (item) => {
        if (!item.pin?.areaId) {
          return item;
        }

        if (!floorId) {
          return {
            ...item,
            pin: {
              areaId: item.pin.areaId,
            },
          } satisfies DraftItem;
        }

        return {
          ...item,
          pin: {
            ...item.pin,
            floorId,
            source: undefined,
            target: undefined,
          },
        } satisfies DraftItem;
      });
    },
    [updateItem]
  );

  const setPinPoint = useCallback(
    (id: string, kind: "source" | "target", point: RelativePoint) => {
      updateItem(id, (item) => {
        const pin = item.pin;
        if (!pin?.areaId) {
          return item;
        }

        if (!pin.floorId) {
          return item;
        }

        return {
          ...item,
          pin: {
            ...pin,
            [kind]: point,
          },
        } satisfies DraftItem;
      });
    },
    [updateItem]
  );

  const reset = useCallback(() => {
    const initial = createInitialDraft();
    setItems([initial]);
    setSelectedItemId(initial.id);
  }, []);

  return {
    items,
    selectedItemId,
    selectedItem,
    selectItem,
    addItem,
    addMultipleItems,
    removeItem,
    updateItemFields,
    updateStatus,
    setArea,
    setFloor,
    setPinPoint,
    reset,
  } satisfies TaskDraftState;
}
