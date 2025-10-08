/**
 * Supabase Area Repository Implementation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Area, Floor } from "@/types/app";
import type { Database } from "@/types/supabase";
import { dbAreaToArea, dbFloorToFloor } from "../mappers";

type DbArea = Database["public"]["Tables"]["areas"]["Row"];
type DbFloor = Database["public"]["Tables"]["floors"]["Row"];

export class SupabaseAreaRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findAll(): Promise<Area[]> {
    // エリアとフロアを一緒に取得
    const { data: areas, error: areasError } = await this.supabase
      .from("areas")
      .select("*")
      .order("name");

    if (areasError) {
      throw new Error(`Failed to fetch areas: ${areasError.message}`);
    }

    const { data: floors, error: floorsError } = await this.supabase
      .from("floors")
      .select("*")
      .order("order_index");

    if (floorsError) {
      throw new Error(`Failed to fetch floors: ${floorsError.message}`);
    }

    // エリアごとにフロアをグループ化
    return areas.map((area) => {
      const areaFloors = floors
        .filter((floor) => floor.area_id === area.id)
        .map((floor) => dbFloorToFloor(floor));
      
      return dbAreaToArea(area, areaFloors);
    });
  }

  async findById(id: string): Promise<Area | null> {
    const { data: area, error: areaError } = await this.supabase
      .from("areas")
      .select("*")
      .eq("id", id)
      .single();

    if (areaError) {
      if (areaError.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch area: ${areaError.message}`);
    }

    const { data: floors, error: floorsError } = await this.supabase
      .from("floors")
      .select("*")
      .eq("area_id", id)
      .order("order_index");

    if (floorsError) {
      throw new Error(`Failed to fetch area floors: ${floorsError.message}`);
    }

    const areaFloors = floors.map((floor) => dbFloorToFloor(floor));
    return dbAreaToArea(area, areaFloors);
  }

  async findFloorById(floorId: string): Promise<Floor | null> {
    const { data, error } = await this.supabase
      .from("floors")
      .select("*")
      .eq("id", floorId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch floor: ${error.message}`);
    }

    return dbFloorToFloor(data);
  }

  async getFloorsByAreaId(areaId: string): Promise<Floor[]> {
    const { data, error } = await this.supabase
      .from("floors")
      .select("*")
      .eq("area_id", areaId)
      .order("order_index");

    if (error) {
      throw new Error(`Failed to fetch floors for area: ${error.message}`);
    }

    return data.map((floor) => dbFloorToFloor(floor));
  }
}