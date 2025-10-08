/**
 * ItemRepository - Supabase実装
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "@/types/app";
import type { Database } from "@/types/supabase";
import {
  dbItemToItem,
  dbLocationsToLocationPin,
  itemToDbItemInsert,
  itemToDbItemUpdate,
} from "../mappers";

export class SupabaseItemRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  async findAll(): Promise<Item[]> {
    const { data, error } = await this.client
      .from("task_items")
      .select(`
        *,
        pickup_location:locations!pickup_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        ),
        dropoff_location:locations!dropoff_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        )
      `);

    if (error) {
      throw new Error(`Failed to fetch all items: ${error.message}`);
    }

    // 各アイテムの写真IDsを取得
    const itemsWithPhotos = await Promise.all(
      (data || []).map(async (item) => {
        const { data: photos, error: photosError } = await this.client
          .from("task_item_photos")
          .select("id")
          .eq("task_item_id", item.id);

        if (photosError) {
          // エラーをログに記録（本番では適切なログシステムを使用）
          return dbItemToItem(item, undefined, []);
        }

        const photoIds = (photos || []).map((photo) => photo.id);

        // LocationPinを構築
        const pin = dbLocationsToLocationPin(
          item.pickup_location as unknown as any,
          item.dropoff_location as unknown as any
        );

        return dbItemToItem(item, pin, photoIds);
      })
    );

    return itemsWithPhotos;
  }

  async findByTaskId(taskId: string): Promise<Item[]> {
    let query = this.client
      .from("task_items")
      .select(`
        *,
        pickup_location:locations!pickup_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        ),
        dropoff_location:locations!dropoff_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        )
      `);

    // taskIdが空文字でない場合のみフィルタを適用
    if (taskId !== "") {
      query = query.eq("task_id", taskId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    // 各アイテムの写真IDsを取得
    const itemsWithPhotos = await Promise.all(
      (data || []).map(async (item) => {
        const { data: photos, error: photosError } = await this.client
          .from("task_item_photos")
          .select("id")
          .eq("task_item_id", item.id);

        if (photosError) {
          // エラーをログに記録（本番では適切なログシステムを使用）
          return dbItemToItem(item, undefined, []);
        }

        const photoIds = (photos || []).map((photo) => photo.id);

        // LocationPinを構築
        const pin = dbLocationsToLocationPin(
          item.pickup_location as unknown as any,
          item.dropoff_location as unknown as any
        );

        return dbItemToItem(item, pin, photoIds);
      })
    );

    return itemsWithPhotos;
  }

  async findById(id: string): Promise<Item | null> {
    const { data, error } = await this.client
      .from("task_items")
      .select(`
        *,
        pickup_location:locations!pickup_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        ),
        dropoff_location:locations!dropoff_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch item: ${error.message}`);
    }

    // 写真IDsを取得
    const { data: photos, error: photosError } = await this.client
      .from("task_item_photos")
      .select("id")
      .eq("task_item_id", id);

    if (photosError) {
      return dbItemToItem(data, undefined, []);
    }

    const photoIds = (photos || []).map((photo) => photo.id);

    // LocationPinを構築
    const pin = dbLocationsToLocationPin(
      data.pickup_location as any,
      data.dropoff_location as any
    );

    return dbItemToItem(data, pin, photoIds);
  }

  async create(item: Omit<Item, "id" | "pin" | "photoIds">): Promise<Item> {
    const itemInsert = itemToDbItemInsert(item);

    const { data, error } = await this.client
      .from("task_items")
      .insert(itemInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create item: ${error.message}`);
    }

    return dbItemToItem(data, undefined, []);
  }

  async update(
    id: string,
    updates: Partial<
      Pick<
        Item,
        "name" | "quantity" | "sourceName" | "targetName" | "handler" | "status"
      >
    >,
    pickupLocationId?: string,
    dropoffLocationId?: string
  ): Promise<Item> {
    const itemUpdate = itemToDbItemUpdate(
      updates,
      pickupLocationId,
      dropoffLocationId
    );

    const { data, error } = await this.client
      .from("task_items")
      .update(itemUpdate)
      .eq("id", id)
      .select(`
        *,
        pickup_location:locations!pickup_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        ),
        dropoff_location:locations!dropoff_location_id(
          *,
          floor:floors(
            *,
            area:areas(*)
          )
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }

    // 写真IDsを取得
    const { data: photos, error: photosError } = await this.client
      .from("task_item_photos")
      .select("id")
      .eq("task_item_id", id);

    if (photosError) {
      return dbItemToItem(data, undefined, []);
    }

    const photoIds = (photos || []).map((photo) => photo.id);

    // LocationPinを構築
    const pin = dbLocationsToLocationPin(
      data.pickup_location as any,
      data.dropoff_location as any
    );

    return dbItemToItem(data, pin, photoIds);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("task_items")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }
}
