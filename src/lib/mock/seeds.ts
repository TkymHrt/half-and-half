import type { Area, Issue, Item, ItemPhoto, LogEvent, Task } from "@/types/app";
import type { PhotoSeed } from "./repositories/photos";

const FLOOR_WIDTH = 4961;
const FLOOR_HEIGHT = 3508;

const PLACEHOLDER_PREVIEW_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z/C/HwAFgwJ/l80p0AAAAABJRU5ErkJggg==";

export const areaSeeds: Area[] = [
  {
    id: "campus-main",
    name: "配置図",
    floors: [
      {
        id: "campus-main-01",
        name: "メイン図面 (1/4)",
        imageUrl: "/maps/R5_校内見取り図_pages-to-jpg-0001.jpg",
        width: FLOOR_WIDTH,
        height: FLOOR_HEIGHT,
      },
      {
        id: "campus-main-02",
        name: "メイン図面 (2/4)",
        imageUrl: "/maps/R5_校内見取り図_pages-to-jpg-0002.jpg",
        width: FLOOR_WIDTH,
        height: FLOOR_HEIGHT,
      },
      {
        id: "campus-main-03",
        name: "メイン図面 (3/4)",
        imageUrl: "/maps/R5_校内見取り図_pages-to-jpg-0003.jpg",
        width: FLOOR_WIDTH,
        height: FLOOR_HEIGHT,
      },
      {
        id: "campus-main-04",
        name: "メイン図面 (4/4)",
        imageUrl: "/maps/R5_校内見取り図_pages-to-jpg-0004.jpg",
        width: FLOOR_WIDTH,
        height: FLOOR_HEIGHT,
      },
    ],
  },
];

export const taskSeeds: Task[] = [
  {
    id: "task-setup-stage",
    title: "メインステージの設営",
    description: "音響機材と照明の設置を行う",
    handler: "ステージ班",
    status: "in_progress",
    itemIds: ["item-mixer", "item-light"],
    createdAt: "2025-09-20T08:15:00.000Z",
  },
  {
    id: "task-food-area",
    title: "模擬店エリアの備品搬入",
    description: "テントと机・椅子を配置する",
    handler: "模擬店班",
    status: "not_started",
    itemIds: ["item-tent", "item-table-set"],
    createdAt: "2025-09-20T09:05:00.000Z",
  },
  {
    id: "task-info-desk",
    title: "インフォメーションデスク準備",
    description: "案内看板と配布物の準備を行う",
    handler: "総務局",
    status: "done",
    itemIds: ["item-info-board"],
    createdAt: "2025-09-19T14:30:00.000Z",
  },
];

export const itemSeeds: Item[] = [
  {
    id: "item-mixer",
    taskId: "task-setup-stage",
    name: "ミキサー卓",
    quantity: 1,
    sourceName: "講義棟A 倉庫",
    targetName: "メインステージ",
    handler: "音響チーム",
    status: "moving",
    pin: {
      areaId: "campus-main",
      floorId: "campus-main-01",
      source: { x: 0.22, y: 0.74 },
      target: { x: 0.68, y: 0.26 },
    },
  },
  {
    id: "item-light",
    taskId: "task-setup-stage",
    name: "LED ライトバー",
    quantity: 4,
    sourceName: "体育館 ストックルーム",
    targetName: "メインステージ 袖",
    handler: "照明チーム",
    status: "unplaced",
    pin: {
      areaId: "campus-main",
      floorId: "campus-main-01",
      source: { x: 0.18, y: 0.62 },
      target: { x: 0.65, y: 0.31 },
    },
  },
  {
    id: "item-tent",
    taskId: "task-food-area",
    name: "模擬店テント",
    quantity: 3,
    sourceName: "第二倉庫",
    targetName: "模擬店エリア 西側",
    handler: "模擬店班 西チーム",
    status: "issue",
    pin: {
      areaId: "campus-main",
      floorId: "campus-main-02",
      source: { x: 0.32, y: 0.52 },
      target: { x: 0.58, y: 0.44 },
    },
  },
  {
    id: "item-table-set",
    taskId: "task-food-area",
    name: "机・椅子セット",
    quantity: 12,
    sourceName: "講義棟B 2F",
    targetName: "模擬店エリア 南側",
    handler: "模擬店班 南チーム",
    status: "moving",
    pin: {
      areaId: "campus-main",
      floorId: "campus-main-02",
      source: { x: 0.28, y: 0.48 },
      target: { x: 0.62, y: 0.57 },
    },
  },
  {
    id: "item-info-board",
    taskId: "task-info-desk",
    name: "案内看板",
    quantity: 2,
    sourceName: "総務局 事務室",
    targetName: "体育館 入口付近",
    handler: "総務局",
    status: "placed",
    pin: {
      areaId: "campus-main",
      floorId: "campus-main-03",
      source: { x: 0.41, y: 0.35 },
      target: { x: 0.69, y: 0.39 },
    },
    photoIds: ["photo-100"],
  },
];

export const photoSeeds: PhotoSeed[] = [
  {
    metadata: {
      id: "photo-100",
      itemId: "item-info-board",
      fileName: "info-desk-setup.png",
      mimeType: "image/png",
      size: 68,
      createdAt: "2025-09-19T14:55:00.000Z",
      note: "設営完了時の記録",
      hasBlob: true,
      previewDataUrl: PLACEHOLDER_PREVIEW_DATA_URL,
    } satisfies ItemPhoto,
    dataUrl: PLACEHOLDER_PREVIEW_DATA_URL,
  },
];

export const logSeeds: LogEvent[] = [
  {
    id: "log-001",
    at: "2025-09-20T08:16:00.000Z",
    actor: "山田 (ステージ班)",
    type: "item_status_changed",
    payload: {
      itemId: "item-mixer",
      status: "moving",
      note: "本部前に向けて移動中",
    },
  },
  {
    id: "log-002",
    at: "2025-09-20T09:10:00.000Z",
    actor: "佐藤 (模擬店班)",
    type: "issue_reported",
    payload: {
      itemId: "item-tent",
      issueId: "issue-001",
      summary: "テント一式の部材不足を確認",
    },
  },
  {
    id: "log-003",
    at: "2025-09-19T15:00:00.000Z",
    actor: "総務局",
    type: "item_photo_uploaded",
    payload: {
      itemId: "item-info-board",
      photoId: "photo-100",
    },
  },
];

export const issueSeeds: Issue[] = [
  {
    id: "issue-001",
    at: "2025-09-20T09:09:00.000Z",
    reporter: "佐藤 (模擬店班)",
    itemId: "item-tent",
    summary: "テント部材の支柱が一本不足",
    detail: "予備の倉庫を確認中。交換部材の手配が必要。",
    kind: "loss",
    status: "open",
  },
];
