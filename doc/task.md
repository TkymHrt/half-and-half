# Supabase 連携タスクリスト

## ゴール

- Supabase に作成済みのデータベースと `half-and-half` アプリを接続し、既存のモック実装から完全に移行する。
- タスク / 物品 / ログ / 問題 / 図面 / 写真の CRUD を Supabase 由来のデータで一貫させる。
- 主要ページ（ホーム、タスク一覧・詳細、マップ、ログ）と関連ダイアログが正しく動作し、権限と監査ログも保持される状態にする。

## 前提・仮定

- Supabase 側には `tasks`, `items`, `item_photos`, `logs`, `issues`, `areas`, `floors` 等のテーブルが存在し、アプリの `src/types/app.ts` と同等のスキーマを保持していると仮定する。差分がある場合は Milestone 0 で整備する。
- 画像ファイル保存用に `item-photos` などの Supabase Storage バケットを利用可能。
- RLS（Row Level Security）は有効化されており、アプリで利用するサービスロール / anon キー向けのポリシーを別途整備する必要がある。
- 既存の `lib/mock` 以下はローカル開発用のスタブであり、最終的に削除できる。

## Milestone 0 — スキーマ同期と型整備

- [ ] **M0-1: Supabase スキーマの同期**
  - `pnpm db:pull` で現行スキーマを取得し、`supabase/migrations` をリポジトリに反映。
  - 差分が出た場合は `supabase/migrations` にコミットし、README に適用手順を追記。
  - _成果物_: 最新のスキーマファイル、補足ドキュメント。
- [ ] **M0-2: 型定義の生成と共有化**
  - `pnpm db:types` を実行し、`src/types/supabase.ts` を生成。
  - `src/types/app.ts` とのマッピング表を `doc/db-mapping.md`（新規）に作成し、欠損カラム・型ズレを洗い出す。
  - _成果物_: Supabase 型定義、マッピングドキュメント。
- [ ] **M0-3: RLS / ポリシー確認**
  - Supabase ダッシュボードまたは SQL で各テーブルの RLS 設定を確認。未設定の場合はポリシー草案を策定し `supabase/policies.sql`（新規）に追記。
  - Auth クレームから参照するロール（例: `executive_committee`）に合わせたポリシー条件を明記。
  - _成果物_: RLS 方針メモ、必要なポリシー SQL 草案。

## Milestone 1 — データアクセス層の構築

- [ ] **M1-1: Supabase リポジトリモジュールの新設**
  - `src/lib/data/supabase/` 配下に各エンティティ（tasks/items/logs/issues/areas/photos）用のモジュールを作成。
  - DB 行 ↔ アプリケーション型の変換ヘルパーを `src/lib/data/mappers.ts`（新規）に切り出す。
  - _対象ファイル_: `src/lib/data/**`（新規）、`src/types/app.ts`（必要なら補完）。
- [ ] **M1-2: 共通クエリユーティリティ**
  - フロント（クライアントコンポーネント）とサーバー（RSC / サーバーアクション）が共用できるよう、`createClient` / `createServerClient` ラッパーを拡張。
  - 検索・ページング・フィルタリングの入力型を定義 (`TaskQuery`, `LogQuery` など) し、Supabase クエリに適用。
  - _対象_: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, 新規ユーティリティ。
- [ ] **M1-3: ストレージアクセサの実装**
  - Supabase Storage 用に `src/lib/data/storage/item-photos.ts`（新規）を作成し、アップロード・署名付き URL 生成・削除を実装。
  - 既存の `PhotoRepository` のインターフェース互換 API を提供する。

## Milestone 2 — ドメインサービスの Supabase 対応

- [ ] **M2-1: `lib/application/activity.ts` のリプレース**
  - `TaskRepository`, `ItemRepository`, `PhotoRepository`, `LogRepository` 依存を Supabase 実装に置き換え。
  - `createTaskWithItems`, `updateItemStatusWithLog`, `updateTaskStatusWithLog`, `updateTaskWithLog`, `updateItemWithLog`, `deleteItemWithLog`, `deleteTaskWithLog`, `addItemPhoto` を Supabase 呼び出しで再実装。
  - 可能であれば Postgres RPC かトランザクションを用意し、複数テーブル更新をアトミックに処理。
- [ ] **M2-2: ログ生成フローの整理**
  - `logs` テーブルへの書き込みを Activity サービス経由に集約し、アプリ内で ID 発番を行わない（`uuid` など DB 側に委任）。
  - 既存のログ整形処理 (`lib/presentation/logs.ts`) が新しいペイロードと互換か確認。
  - トリガー / Supabase Edge Functions による自動ログ化が必要ならタスク化。
- [ ] **M2-3: エラーハンドリングと再試行戦略**
  - Supabase エラー（RLS, ネットワーク, バリデーション）を捕捉し、UI 向けの `AppError` 型を新設。
  - `toast` で表示する文言を統一し、`lib/application/errors.ts`（新規）に定義。

## Milestone 3 — UI/Hooks のデータソース刷新

- [ ] **M3-1: ホームダッシュボード (`protected/(app)/home/page.tsx`)**
  - `ensureSeed` / `mock` 依存を排除し、Supabase からのフェッチロジックに差し替え。
  - データ取得をカプセル化した `useDashboardData` を `src/app/protected/(app)/home/hooks/use-dashboard-data.ts` として切り出し、SWR または React Query を導入するか検討。
  - ローディング / エラー表示は既存 UI を踏襲。
- [ ] **M3-2: タスク一覧 (`protected/(app)/tasks/page.tsx`)**
  - Supabase からのページング対応（`limit` / `offset`）を実装し、絞り込みと検索をサーバークエリで処理。
  - `TaskCreateDialog` 完了後に再フェッチ、または mutate でローカル反映。
- [ ] **M3-3: タスク詳細 (`protected/(app)/tasks/[taskId]/page.tsx`)**
  - Supabase から詳細と子アイテムを取得。RSC でプリフェッチしたデータをクライアント側に渡す構成も検討。
  - ステータス更新・タスク削除アクションを Supabase 対応版 Activity サービスに接続。
- [ ] **M3-4: マップページ (`protected/(app)/map/page.tsx`)**
  - `AreaRepository` / `ItemRepository` を Supabase へ置き換え。地図用データは JSONB などの構造に合わせて整形。
  - ピン位置は Supabase 上で `pin_source`, `pin_target` に正規化する案を検討し、マッパーで `RelativePoint` に変換。
- [ ] **M3-5: ログページと関連フック**
  - `/logs` フォルダ内の hooks (`use-bootstrap-data`, `use-log-feed`, `use-issue-actions` 等) を Supabase クエリベースに移行。
  - 無限スクロールは `range()` / `limit` + `order` のクエリで取得。`doesLogMatchFilters` でのクライアントフィルタを最小化。
- [ ] **M3-6: ダイアログ / コンポーネント**
  - `TaskCreateDialog`, `TaskEditDialog`, `IssueReportDialog`, `ItemDetailDrawer` の送信処理を Supabase Activity サービスに差し替え。
  - フォトプレビューは Storage から署名付き URL を取得し、`PhotoRepository` 互換 API で供給。

## Milestone 4 — ストレージ & メディア処理

- [ ] **M4-1: Storage バケット初期化**
  - Supabase CLI もしくはダッシュボードで `item-photos` バケットを作成し、RLS ポリシーを定義。
  - 画像最大サイズや MIME タイプ制限を決め、`README` に記載。
- [ ] **M4-2: `addItemPhoto` フロー刷新**
  - アップロード → メタデータ保存 を分離し、アップロード中の進捗 / キャンセルを処理。
  - 署名付き URL を `ItemPhoto.previewUrl` として返却し、従来の base64 依存を除去。
- [ ] **M4-3: 写真削除のトランザクション保障**
  - アイテム削除時に Storage オブジェクトも削除するよう Activity サービスを更新。
  - Postgres 関数でメタとバケット削除を一括実行する案を検討。

## Milestone 5 — 認可・セッション・監査

- [ ] **M5-1: 認可ロールの整理**
  - Supabase Auth のユーザークレーム（例: `user.role`）を用いて、操作権限を決定。
  - Activity サービスで `actor` を Auth 情報から自動補完し、外部入力を最小化。
- [ ] **M5-2: 監査ログの充実**
  - ログレベル（info/warn/error 等）やイベント種別を Supabase 側で ENUM 化。
  - ログテーブルに IP / User ID などのメタデータ列を追加する場合はマイグレーションを切る。
- [ ] **M5-3: セッション管理の検証**
  - `middleware.ts` と `lib/supabase/middleware.ts` が RLS に必要なクッキーハンドリングを満たすか確認。
  - サーバー／クライアント双方で `createClient` を利用した際のセッション永続を QA。

## Milestone 6 — クリーンアップと品質保証

- [ ] **M6-1: `lib/mock` の段階的削除**
  - Supabase 対応が完了したモジュールから `mock` 参照を排除。
  - 最終的に `lib/mock/**` と `ensureSeed` を削除し、関連 import を全削除。
- [ ] **M6-2: 型 & ESLint チェック**
  - `pnpm check` で Biome ルールを満たすことを確認。
  - `pnpm test` に Supabase をモック化する仕組み（`vitest` + `msw` など）を導入し、主要 Activity サービスのユニットテストを追加。
- [ ] **M6-3: E2E / 手動確認シナリオ**
  - 重要フロー（タスク作成 → 物品追加 → 写真アップロード → マップ表示 → 問題報告 → ログ確認）を列挙し、`doc/manual-checklist.md`（新規）にまとめる。
  - ステージング環境での回帰確認手順を README に追記。

## 追加検討事項（任意強化）

- Supabase Realtime を導入し、ログ一覧やタスクステータスを WebSocket で自動更新する。
- Edge Function/cron で期日超過タスクの通知を送る仕組みの検討。
- 既存 CSV / seeds データから Supabase への初期投入スクリプトを `scripts/seed-supabase.ts` として用意。
- パフォーマンス監視のため、Supabase Query Performance Insights を定期レビューする運用を整備。
