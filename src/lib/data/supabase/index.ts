/**
 * Repository factory - Supabase実装のRepository群を提供
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { SupabaseItemRepository } from "./items";
import { SupabaseTaskRepository } from "./tasks";
// import { SupabasePhotoRepository } from "./photos";
// import { SupabaseLogRepository } from "./logs";
// import { SupabaseIssueRepository } from "./issues";
// import { SupabaseAreaRepository } from "./areas";

export type RepositoryContainer = {
  tasks: SupabaseTaskRepository;
  items: SupabaseItemRepository;
  // photos: SupabasePhotoRepository;
  // logs: SupabaseLogRepository;
  // issues: SupabaseIssueRepository;
  // areas: SupabaseAreaRepository;
};

export function createRepositories(
  client: SupabaseClient<Database>
): RepositoryContainer {
  return {
    tasks: new SupabaseTaskRepository(client),
    items: new SupabaseItemRepository(client),
    // photos: new SupabasePhotoRepository(client),
    // logs: new SupabaseLogRepository(client),
    // issues: new SupabaseIssueRepository(client),
    // areas: new SupabaseAreaRepository(client),
  };
}

// クライアント側用のヘルパー
export function createClientRepositories(): RepositoryContainer {
  // 動的インポートでクライアント側でのみsupabaseクライアントを作成
  const { createClient } = require("@/lib/supabase/client");
  const client = createClient();
  return createRepositories(client);
}

// サーバー側用のヘルパー
export async function createServerRepositories(): Promise<RepositoryContainer> {
  // 動的インポートでサーバー側でのみsupabaseクライアントを作成
  const { createClient } = await import("@/lib/supabase/server");
  const client = await createClient();
  return createRepositories(client);
}
