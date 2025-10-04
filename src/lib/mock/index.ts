// Import all repositories to be used in the seed function and exported.
import { AreaRepo } from "./repositories/areas";
import { IssueRepo } from "./repositories/issues";
import { ItemRepo } from "./repositories/items";
import { LogRepo } from "./repositories/logs";
import { TaskRepo } from "./repositories/tasks";
import { type Task } from "@/types/app";

const SEED_KEY = "mvp_seeded_v1";

export async function ensureSeed() {
  if (typeof window === "undefined" || localStorage.getItem(SEED_KEY)) {
    return;
  }

  // --- Seed Tasks ---
  const task1 = await TaskRepo.create({
    title: "ステージ設営",
    description: "体育館のステージを設営する。音響機材と照明の設置も含む。",
    handler: "運営局",
  });

  const task2 = await TaskRepo.create({
    title: "受付テント準備",
    description: "正門前に受付用のテントを2張設営し、長机と椅子を配置する。",
    handler: "総務局",
  });

  await TaskRepo.create({
    title: "パンフレット配布準備",
    description: "各教室棟の入り口にパンフレットを配置する。",
    handler: "広報局",
    status: "done",
  });

  // --- Seed Items for Task 1 ---
  const task1Items = await ItemRepo.bulkCreate([
    {
      taskId: task1.id,
      name: "スピーカー",
      quantity: 2,
      sourceName: "部室棟C-101",
      targetName: "体育館ステージ",
      handler: "音響担当",
      pin: {
        areaId: "gym",
        floorId: "gym-1f",
        source: { x: 0.1, y: 0.8 },
        target: { x: 0.5, y: 0.2 },
      },
    },
    {
      taskId: task1.id,
      name: "スポットライト",
      quantity: 4,
      sourceName: "倉庫A",
      targetName: "体育館ステージ",
      handler: "照明担当",
      pin: {
        areaId: "gym",
        floorId: "gym-1f",
        source: { x: 0.15, y: 0.85 },
        target: { x: 0.5, y: 0.25 },
      },
    },
  ]);
  await TaskRepo.update(task1.id, {
    itemIds: task1Items.map((i) => i.id),
    status: "in_progress",
  });


  // --- Seed Items for Task 2 ---
  const task2Items = await ItemRepo.bulkCreate([
    {
      taskId: task2.id,
      name: "長机",
      quantity: 4,
      sourceName: "講義棟A-201",
      targetName: "正門前",
      handler: "総務局",
      pin: {
        areaId: "honkan",
        floorId: "honkan-2f",
        source: { x: 0.3, y: 0.4 },
        target: { x: 0.8, y: 0.9 }, // Note: target is on a different map
      },
    },
    {
      taskId: task2.id,
      name: "折りたたみ椅子",
      quantity: 8,
      sourceName: "講義棟A-201",
      targetName: "正門前",
      handler: "総務局",
      pin: {
        areaId: "honkan",
        floorId: "honkan-2f",
        source: { x: 0.3, y: 0.4 },
        target: { x: 0.8, y: 0.9 },
      },
    },
  ]);
  await TaskRepo.update(task2.id, { itemIds: task2Items.map((i) => i.id) });


  // --- Seed Logs ---
  await LogRepo.create({
    actor: "システム",
    type: "task_created",
    payload: { taskId: task1.id, title: task1.title },
  });
  await LogRepo.create({
    actor: "システム",
    type: "task_created",
    payload: { taskId: task2.id, title: task2.title },
  });
  await LogRepo.create({
    actor: "山田太郎",
    type: "item_status_changed",
    payload: {
      itemId: task1Items[0].id,
      itemName: task1Items[0].name,
      from: "unplaced",
      to: "moving",
    },
  });

  localStorage.setItem(SEED_KEY, "true");
  console.log("Mock data seeded.");
}

// Export all repos for easy access from a single point.
export { TaskRepo, ItemRepo, LogRepo, IssueRepo, AreaRepo };