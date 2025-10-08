/**
 * Supabase Issue Repository Implementation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Issue } from "@/types/app";
import type { Database } from "@/types/supabase";
import { dbIssueToIssue, issueToDbIssueInsert } from "../mappers";

type DbIssue = Database["public"]["Tables"]["task_item_issues"]["Row"];
type DbIssueInsert = Database["public"]["Tables"]["task_item_issues"]["Insert"];

export class SupabaseIssueRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findAll(): Promise<Issue[]> {
    const { data, error } = await this.supabase
      .from("task_item_issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }

    return data.map((issue) => dbIssueToIssue(issue));
  }

  async findByItemId(itemId: string): Promise<Issue[]> {
    const { data, error } = await this.supabase
      .from("task_item_issues")
      .select("*")
      .eq("task_item_id", itemId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch item issues: ${error.message}`);
    }

    return data.map((issue) => dbIssueToIssue(issue));
  }

  async findById(id: string): Promise<Issue | null> {
    const { data, error } = await this.supabase
      .from("task_item_issues")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch issue: ${error.message}`);
    }

    return dbIssueToIssue(data);
  }

  async create(
    issue: Omit<Issue, "id" | "at">,
    reportedBy?: string
  ): Promise<Issue> {
    const dbIssueInsert = issueToDbIssueInsert(issue, reportedBy);

    const { data, error } = await this.supabase
      .from("task_item_issues")
      .insert(dbIssueInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create issue: ${error.message}`);
    }

    return dbIssueToIssue(data);
  }

  async updateStatus(
    id: string, 
    status: "open" | "resolved", 
    resolvedBy?: string
  ): Promise<Issue> {
    const updates: { 
      status: "open" | "resolved"; 
      resolved_at?: string; 
      resolved_by?: string; 
    } = {
      status,
    };

    if (status === "resolved") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = resolvedBy;
    }

    const { data, error } = await this.supabase
      .from("task_item_issues")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update issue status: ${error.message}`);
    }

    return dbIssueToIssue(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("task_item_issues")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete issue: ${error.message}`);
    }
  }
}