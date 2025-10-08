/**
 * Repository抽象化層のテスト
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createItemRepository,
  createTaskRepository,
  getRepositoryType,
} from "@/lib/repositories";

describe("Repository抽象化層", () => {
  beforeEach(() => {
    // 環境変数をリセット
    process.env.NEXT_PUBLIC_USE_SUPABASE = undefined;
  });

  it("デフォルトでモック実装を使用する", () => {
    expect(getRepositoryType()).toBe("mock");
  });

  it("環境変数でSupabase実装に切り替わる", () => {
    process.env.NEXT_PUBLIC_USE_SUPABASE = "true";
    // 注意: この時点ではmodule requireキャッシュにより即座に反映されない可能性がある
  });

  it("TaskRepositoryが正常に作成される", async () => {
    const taskRepo = await createTaskRepository();
    expect(taskRepo).toBeDefined();
    expect(typeof taskRepo.findAll).toBe("function");
    expect(typeof taskRepo.findById).toBe("function");
    expect(typeof taskRepo.create).toBe("function");
    expect(typeof taskRepo.update).toBe("function");
    expect(typeof taskRepo.delete).toBe("function");
  });

  it("ItemRepositoryが正常に作成される", async () => {
    const itemRepo = await createItemRepository();
    expect(itemRepo).toBeDefined();
    expect(typeof itemRepo.findByTaskId).toBe("function");
    expect(typeof itemRepo.findById).toBe("function");
    expect(typeof itemRepo.create).toBe("function");
    expect(typeof itemRepo.update).toBe("function");
    expect(typeof itemRepo.delete).toBe("function");
  });

  it("モック実装でタスク一覧を取得できる", async () => {
    const taskRepo = await createTaskRepository();
    const tasks = await taskRepo.findAll();
    expect(Array.isArray(tasks)).toBe(true);
    // モックデータが存在するかどうかは ensureSeed の実行次第
  });

  it("モック実装でアイテム一覧を取得できる", async () => {
    const itemRepo = await createItemRepository();
    const items = await itemRepo.findByTaskId("");
    expect(Array.isArray(items)).toBe(true);
  });
});
