# MVP実装案

1) MVPのゴール（最小で動く到達点）
- ログイン後の保護エリアに4画面を実装（ホーム/タスク/マップ/ログ）
- 共通ヘッダーと下部ナビ（4タブ）
- タスク作成モーダル（タスク基本情報→物品追加→マップ上で「借用元/移動先」のピン配置）
- タスク一覧/詳細（物品一覧）＋検索/フィルタ
- マップ（画像ベース、エリア/階層の切替、ピン表示、ソート/フィルタ、ピンタップで物品リスト）
- ログ一覧（無限スクロール風の疑似ロード）＋「問題報告」モーダル
- 進捗サマリー（ホーム）＋お知らせ（簡易フィード）
- 写真添付による「配置完了報告」（端末カメラ起動、ローカル保存）
- データはすべてモック層（localStorage/メモリ）でCRUD。Promiseで非同期化し、あとでSupabaseに差し替え可能な構造にする

2) 追加ルーティング/ファイル構成案（既存に追記）
- app/protected 配下に4画面を追加し、protected/layout.tsx に共通ヘッダー/下部ナビを組み込む

追加ファイル（例）
- app/protected/(app)/home/page.tsx
- app/protected/(app)/tasks/page.tsx
- app/protected/(app)/tasks/[taskId]/page.tsx
- app/protected/(app)/map/page.tsx
- app/protected/(app)/logs/page.tsx
- components/app/header.tsx（画面タイトル＋右上ボタン）
- components/app/bottom-nav.tsx（4タブ）
- components/app/task-create-dialog.tsx（ステップ式モーダル）
- components/app/issue-report-dialog.tsx
- components/app/map/floor-map.tsx（react-leaflet）
- components/app/map/pin-legend.tsx
- lib/mock/index.ts（モックのFacade）
- lib/mock/repositories/*.ts（task/item/log/location 各Repository）
- lib/mock/storage.ts（localStorage/IndexedDB抽象）
- lib/store/app-store.ts（Zustand/Context）
- types/app.ts（ドメイン型）
- public/maps/{area}/{floor}.png（設計図画像）

3) 型定義（types/app.ts）
- 後でDBに落とす前提の最小セット

```ts
export type ID = string;

export type TaskStatus = 'not_started' | 'in_progress' | 'done';
export type ItemStatus = 'unplaced' | 'moving' | 'placed' | 'issue';

export type Area = {
  id: ID;
  name: string; // 例: "本館"
  floors: Floor[];
};

export type Floor = {
  id: ID;
  name: string; // 例: "1F"
  imageUrl: string; // public/maps/honkan/1f.png
  width: number; // px
  height: number; // px
};

export type RelativeXY = { x: number; y: number }; // 0..1 正規化座標

export type LocationPin = {
  areaId: ID;
  floorId: ID;
  source?: RelativeXY;   // 借用元
  target?: RelativeXY;   // 移動先
};

export type Item = {
  id: ID;
  taskId: ID;
  name: string;
  quantity: number;
  sourceName: string; // テキスト: "201講義室"
  targetName: string; // テキスト: "体育館ステージ"
  handler?: string;   // テキスト: "総務局長・名前" など
  status: ItemStatus;
  pin?: LocationPin;
  photoIds?: ID[];    // 写真（モックではIDB/LS）の参照
};

export type Task = {
  id: ID;
  title: string;
  description?: string;
  handler?: string;
  status: TaskStatus;
  itemIds: ID[];
  createdAt: string;
};

export type LogEvent = {
  id: ID;
  at: string;
  actor: string; // 表示名のみ
  type:
    | 'task_created' | 'item_added' | 'item_status_changed'
    | 'issue_reported' | 'item_photo_uploaded';
  payload: Record<string, any>;
};

export type Issue = {
  id: ID;
  at: string;
  reporter: string;
  itemId?: ID;
  summary: string;
  detail?: string;
  kind: 'loss' | 'damage' | 'other';
  status: 'open' | 'resolved';
};
```

4) モック層の設計
- Repositoryインターフェースを用意し、モック実装は localStorage/メモリで Promise を返す
- 将来 Supabase 化は Repository を差し替えるだけ

例）lib/mock/repositories/tasks.ts
```ts
import { Task, ID } from '@/types/app';
import { v4 as uuid } from 'uuid';

const LS_KEY = 'mvp_tasks';

function read(): Task[] {
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function write(data: Task[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const TaskRepo = {
  async list(query?: { search?: string; status?: string }) {
    await delay();
    let data = read();
    if (query?.search) {
      const q = query.search.toLowerCase();
      data = data.filter(t => t.title.toLowerCase().includes(q));
    }
    if (query?.status) {
      data = data.filter(t => t.status === query.status);
    }
    return data;
  },
  async get(id: ID) {
    await delay();
    return read().find(t => t.id === id) || null;
  },
  async create(input: Omit<Task, 'id' | 'createdAt' | 'itemIds' | 'status'> & { status?: Task['status'] }) {
    await delay();
    const t: Task = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      itemIds: [],
      status: input.status ?? 'not_started',
      title: input.title,
      description: input.description,
      handler: input.handler,
    };
    const data = read();
    data.unshift(t);
    write(data);
    return t;
  },
  async update(id: ID, patch: Partial<Task>) {
    await delay();
    const data = read();
    const i = data.findIndex(t => t.id === id);
    if (i === -1) return null;
    data[i] = { ...data[i], ...patch };
    write(data);
    return data[i];
  },
};

function delay(ms = 250) {
  return new Promise(res => setTimeout(res, ms));
}
```

- items, logs, issues, areas/floors も同様に作成
- 写真は容量対策で IndexedDB を推奨（idb-keyval）。簡易ならメモリURLでも可

5) 状態管理
- 最低限は各ページで Repo を叩く形でOK。更新時にログ記録もセットで行うユーティリティを用意
- 視覚的なサマリー（ホーム）やバッジ更新に合わせてグローバルに集計したいなら Zustand を1つ導入

lib/store/app-store.ts（簡易例）
```ts
import { create } from 'zustand';

type UIState = {
  currentTitle: string;
  setTitle: (t: string) => void;
  lastSeenLogAt?: string;
  setLastSeenLogAt: (iso: string) => void;
};
export const useUI = create<UIState>((set) => ({
  currentTitle: '',
  setTitle: (t) => set({ currentTitle: t }),
  lastSeenLogAt: undefined,
  setLastSeenLogAt: (v) => set({ lastSeenLogAt: v }),
}));
```

6) 共通UI
- Header: 画面タイトル＋右上に「タスク作成」または「問題報告」ボタン
- BottomNav: ホーム/タスク/マップ/ログ の4つ（lucide-react アイコン）

components/app/header.tsx（概略）
```tsx
'use client';
import { Button } from '@/components/ui/button';

export function AppHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 h-12">
      <div className="font-semibold">{title}</div>
      <div>{action}</div>
    </div>
  );
}
```

components/app/bottom-nav.tsx（概略）
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListTodo, Map, ListChecks } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const tabs = [
    { href: '/protected/home', label: 'ホーム', icon: Home },
    { href: '/protected/tasks', label: 'タスク', icon: ListTodo },
    { href: '/protected/map', label: 'マップ', icon: Map },
    { href: '/protected/logs', label: 'ログ', icon: ListChecks },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-background">
      <ul className="grid grid-cols-4">
        {tabs.map(t => {
          const active = pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link href={t.href} className={`flex flex-col items-center py-2 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon size={20} />
                <span className="text-[11px]">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

protected/layout.tsx のボトムに <BottomNav /> を配置し、ページごとに <AppHeader /> を差し込む

7) 各画面の実装ポイント

ホーム画面
- 全体進捗（未着手/作業中/完了）を Task/Item から集計して数値＋簡易グラフ（shadcn/ui の Progress や Chart コンポーネント）
- 未対応の問題件数
- お知らせフィード：直近の LogEvent を新着順で5〜10件表示。タップで該当ページへ

タスク一覧
- テーブル表示（shadcn/ui table）＋検索（タイトル/担当者）＋ステータスフィルタ
- 行タップでタスク詳細へ
- 右上「タスク作成」ボタンでモーダル起動

タスク詳細（物品一覧）
- タスク基本情報（担当者、ステータス）＋物品テーブル
- 物品のステータス変更（unplaced→moving→placed）と「問題」への遷移
- 物品詳細ドロワーで「写真添付」（input type=file accept="image/*" capture="environment"）
- 写真とともに「配置完了報告」→ ItemStatus: placed、LogEvent追加

マップ
- エリア/階層切替（Select）で ImageOverlay を差し替え
- ピンは Item.pin を集約し、statusに応じて色/アイコンを変更
- リスト/ソート/フィルタ（status/借用元/移動先）
- ピンタップでその地点に紐づく物品を小パネルで表示（クリックで該当物品詳細へ）

ログ
- LogEvent を新着順でカード表示
- 疑似無限スクロール（スクロール末尾で次のページを Promise で返す）
- 右上「問題報告」ボタンからモーダル（種別、概要、対象物品 optional、詳細）

8) タスク作成モーダル（ステップ）
- Step1: タスク名/説明/担当者
- Step2: 物品追加（行を追加するUI。物品名、個数、借用元/移動先テキスト、担当者）
- Step3: 位置指定（エリア/階層を選択 → 画像マップ上で source と target を順にタップしてピン配置。各物品ごとに指定）

components/app/task-create-dialog.tsx の実装の要点
- 内部 state に items[] と pin 指定状況を持つ
- 登録時に TaskRepo.create → ItemRepo.bulkCreate → LogEvent 追加
- 位置指定はモーダル内で <FloorMap mode="place" ...> を呼び出し、onPlace({source|target, x, y}) で RelativeXY を受け取る

9) react-leaflet 画像マップ実装
- CRS.Simple を利用し、ImageOverlay に floor.width/height を使って座標を [0,0]〜[height,width] に配置
- RelativeXY(0..1) を Leaflet 座標へ変換: latlng = [floor.height * y, floor.width * x]

components/app/map/floor-map.tsx（概略）
```tsx
'use client';
import { MapContainer, ImageOverlay, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type PlaceMode = { enabled: boolean; onPlace: (p: { x: number; y: number }) => void };

export function FloorMap({
  floor, // { imageUrl, width, height }
  pins,  // { id, x, y, kind: 'source'|'target', status }[]
  placeMode,
}: {
  floor: { imageUrl: string; width: number; height: number };
  pins?: { id: string; x: number; y: number; kind: 'source' | 'target'; status: string }[];
  placeMode?: PlaceMode;
}) {
  const bounds: L.LatLngBoundsExpression = [[0,0], [floor.height, floor.width]];

  function RelMarker({ x, y, ...rest }: { x: number; y: number; [k: string]: any }) {
    const latlng: [number, number] = [floor.height * y, floor.width * x];
    return <Marker position={latlng} {...rest} />;
  }

  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (!placeMode?.enabled) return;
        const { lat, lng } = e.latlng; // lat=Y, lng=X
        const x = Math.min(Math.max(lng / floor.width, 0), 1);
        const y = Math.min(Math.max(lat / floor.height, 0), 1);
        placeMode.onPlace({ x, y });
      },
    });
    return null;
  }

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      zoom={0}
      minZoom={-2}
      maxZoom={2}
      className="h-[60vh] w-full border"
    >
      <ImageOverlay url={floor.imageUrl} bounds={bounds} />
      {pins?.map(p => (
        <RelMarker key={p.id} x={p.x} y={p.y} />
      ))}
      <ClickHandler />
    </MapContainer>
  );
}
```

10) ログの記録と通知
- すべての重要操作で logEvent() を呼ぶ（タスク作成、物品追加、物品ステータス変更、写真アップロード、問題報告）
- ホーム画面「お知らせ」は直近の Log から生成
- 既読管理は lastSeenLogAt（Zustand）で実装し、ホーム表示時に更新

11) 写真添付（MVP）
- input type="file" accept="image/*" capture="environment"
- 簡易：File を URL.createObjectURL で表示。IDB（idb-keyval）に格納すると再読み込みにも耐える
- 将来 Supabase Storage へ移行

12) サンプルシード（初回起動時）
- 初回ロードで localStorage に tasks/items/areas/floors/logs を投入

lib/mock/index.ts（概略）
```ts
export async function ensureSeed() {
  if (!localStorage.getItem('mvp_seeded')) {
    // areas/floors
    // tasks/items
    // logs
    localStorage.setItem('mvp_seeded', '1');
  }
}
```

13) shadcn/ui コンポーネント活用箇所
- フォーム: Form, Input, Textarea, Select, Button
- モーダル/ドロワー: Dialog, Drawer
- テーブル: Table
- フィード/リスト: Card, ScrollArea, Badge
- トースト: sonner（操作成功/失敗を表示）
- 進捗グラフ: Progress もしくは簡易 Chart

14) セットアップ（追加パッケージ）
- react-leaflet, leaflet
- zustand（任意）
- idb-keyval（任意；写真の永続化に推奨）
- lucide-react（アイコン）
- zod（フォームバリデーションに推奨）

コマンド例
- npm i react-leaflet leaflet zustand lucide-react zod idb-keyval

Leaflet の CSS をグローバルに読み込み
- app/globals.css に @import 'leaflet/dist/leaflet.css';

15) 画面ごとの受け入れ基準（MVP）
- ホーム
  - 進捗サマリーが数値で見える
  - 未対応問題数が表示され、タップでログに遷移
  - お知らせが新着順で表示
- タスク
  - 一覧で検索/フィルタが効く
  - タスク作成モーダルで物品を追加し、マップで借用元/移動先をピン指定できる
  - 作成後、一覧とログに反映
- タスク詳細
  - 物品のステータス更新ができ、ログに反映
  - 写真添付で「配置完了」を報告できる（画像表示まで）
- マップ
  - エリア/階層切替ができる
  - ステータスに応じてピンが出分けされる
  - ピンをタップすると関連物品が見える
- ログ
  - 新着順で表示、疑似無限スクロールが動作
  - 問題報告モーダルからレポートを作成できる

16) 将来の Supabase 接続（置換ポイント）
- Repository を Supabase 実装に差し替え
- 想定テーブル（簡略）
  - tasks(id, title, description, handler, status, created_at)
  - items(id, task_id, name, quantity, source_name, target_name, handler, status)
  - item_pins(item_id, area_id, floor_id, source_x, source_y, target_x, target_y)  // 0..1 正規化
  - areas(id, name)
  - floors(id, area_id, name, image_url, width, height)
  - logs(id, at, actor, type, payload jsonb)
  - issues(id, at, reporter, item_id, summary, detail, kind, status)
- ストレージ
  - storage bucket: item-photos（item_id/uuid.jpg）
- 典型的な置換
  - TaskRepo.list → supabase.from('tasks').select(...)
  - ItemRepo.updateStatus → supabase.rpc('update_item_status_with_log', ...) などでも良い
- RLS
  - users はすでに auth実装があるので、行の read は全体可、write は管理者か担当者のみに制限する運用も可（MVPの要件では全員閲覧OK）

17) 実装順（目安）
- Day1: ルーティング/共通レイアウト/下部ナビ/モック層とシード
- Day2: タスク一覧/作成モーダル（Step1/2）
- Day3: マップ画像/ピン配置（Step3）とマップ画面の閲覧
- Day4: タスク詳細（物品一覧・状態更新）/写真添付
- Day5: ホーム（サマリー/お知らせ）、ログ（問題報告/無限スクロール風）
- 余裕があれば: 検索/フィルタのリッチ化、ピンの色分け/凡例、UI磨き

18) 小さな実装Tips
- 画像マップは public 配下に置き、floor.width/height を実画像サイズに揃えるとクリック座標が正確
- RelativeXY は0..1で保存し、画面解像度や画像差し替えにも強くする
- 物品の source/target ピンは、配置中は両方見せる、配置済みは target のみ見せるなどのルールを UI 側で持つ
- 問題報告は Item に紐づけても、タスク単位の自由記述でも許容（MVPは柔軟に）
