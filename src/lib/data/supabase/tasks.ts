/**
 * TaskRepository - Supabase実装
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "@/types/app";
import type { Database } from "@/types/supabase";
import {
  dbTaskToTask,
  taskToDbTaskInsert,
  taskToDbTaskUpdate,
} from "../mappers";

export class SupabaseTaskRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findAll(): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    // 各タスクのitemIdsを取得
    const tasksWithItems = await Promise.all(
      (data || []).map(async (task) => {
        const { data: items, error: itemsError } = await this.client
          .from("task_items")
          .select("id")
          .eq("task_id", task.id);

        if (itemsError) {
          return dbTaskToTask(task, []);
        }

        const itemIds = (items || []).map((item) => item.id);
        return dbTaskToTask(task, itemIds);
      })
    );

    return tasksWithItems;
  }

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    // itemIdsを取得
    const { data: items, error: itemsError } = await this.client
      .from("task_items")
      .select("id")
      .eq("task_id", id);

    if (itemsError) {
      return dbTaskToTask(data, []);
    }

    const itemIds = (items || []).map((item) => item.id);
    return dbTaskToTask(data, itemIds);
  }

  async create(
    task: Omit<Task, "id" | "itemIds" | "createdAt">
  ): Promise<Task> {
    const taskInsert = taskToDbTaskInsert(task);

    const { data, error } = await this.client
      .from("tasks")
      .insert(taskInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return dbTaskToTask(data, []);
  }

  async update(
    id: string,
    updates: Partial<Pick<Task, "title" | "description" | "handler" | "status">>
  ): Promise<Task> {
    const taskUpdate = taskToDbTaskUpdate(updates);

    const { data, error } = await this.client
      .from("tasks")
      .update(taskUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    // itemIdsを取得
    const { data: items, error: itemsError } = await this.client
      .from("task_items")
      .select("id")
      .eq("task_id", id);

    if (itemsError) {
      return dbTaskToTask(data, []);
    }

    const itemIds = (items || []).map((item) => item.id);
    return dbTaskToTask(data, itemIds);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("tasks").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }
}
