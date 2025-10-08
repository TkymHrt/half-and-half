/**
 * Supabase Photo Repository Implementation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ItemPhoto } from "@/types/app";
import type { Database } from "@/types/supabase";
import { dbPhotoToItemPhoto, itemPhotoToDbPhotoInsert } from "../mappers";

type DbPhoto = Database["public"]["Tables"]["task_item_photos"]["Row"];
type DbPhotoInsert = Database["public"]["Tables"]["task_item_photos"]["Insert"];

export class SupabasePhotoRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findByItemId(itemId: string): Promise<ItemPhoto[]> {
    const { data, error } = await this.supabase
      .from("task_item_photos")
      .select("*")
      .eq("task_item_id", itemId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch photos: ${error.message}`);
    }

    return data.map((photo) => dbPhotoToItemPhoto(photo));
  }

  async findById(id: string): Promise<ItemPhoto | null> {
    const { data, error } = await this.supabase
      .from("task_item_photos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch photo: ${error.message}`);
    }

    return dbPhotoToItemPhoto(data);
  }

  async create(
    photo: Omit<ItemPhoto, "id" | "createdAt" | "hasBlob">,
    storagePath: string
  ): Promise<ItemPhoto> {
    const dbPhotoInsert = itemPhotoToDbPhotoInsert(photo, storagePath);

    const { data, error } = await this.supabase
      .from("task_item_photos")
      .insert(dbPhotoInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create photo: ${error.message}`);
    }

    return dbPhotoToItemPhoto(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("task_item_photos")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  async updateCaption(id: string, caption: string): Promise<ItemPhoto> {
    const { data, error } = await this.supabase
      .from("task_item_photos")
      .update({ caption })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update photo caption: ${error.message}`);
    }

    return dbPhotoToItemPhoto(data);
  }
}