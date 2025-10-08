/**
 * Supabase Log Repository Implementation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LogEvent } from "@/types/app";
import type { Database } from "@/types/supabase";
import { dbLogToLogEvent, logEventToDbLogInsert } from "../mappers";

type DbLog = Database["public"]["Tables"]["activity_logs"]["Row"];
type DbLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export class SupabaseLogRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findAll(limit = 50): Promise<LogEvent[]> {
    const { data, error } = await this.supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data.map((log) => dbLogToLogEvent(log));
  }

  async findByTaskId(taskId: string, limit = 20): Promise<LogEvent[]> {
    const { data, error } = await this.supabase
      .from("activity_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch task logs: ${error.message}`);
    }

    return data.map((log) => dbLogToLogEvent(log));
  }

  async findByItemId(itemId: string, limit = 20): Promise<LogEvent[]> {
    const { data, error } = await this.supabase
      .from("activity_logs")
      .select("*")
      .eq("task_item_id", itemId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch item logs: ${error.message}`);
    }

    return data.map((log) => dbLogToLogEvent(log));
  }

  async create(
    logEvent: Omit<LogEvent, "id" | "at">,
    actorProfileId?: string
  ): Promise<LogEvent> {
    const dbLogInsert = logEventToDbLogInsert(logEvent, actorProfileId);

    const { data, error } = await this.supabase
      .from("activity_logs")
      .insert(dbLogInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create log: ${error.message}`);
    }

    return dbLogToLogEvent(data);
  }

  async deleteOldLogs(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error, count } = await this.supabase
      .from("activity_logs")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to delete old logs: ${error.message}`);
    }

    return count || 0;
  }
}