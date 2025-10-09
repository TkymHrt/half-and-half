# Supabase バックエンド最終設計

## 設計ポリシー

- モバイル端末からの直接操作を想定し、すべての CRUD は Supabase Auth の認証下で完結させる。
- フロントエンドの既存ドメイン型 (`Task`, `Item`, `Issue`, `LogEvent`, `Area` など) と一対一に対応するデータを保持する。
- 監査性と運用トレーサビリティを優先し、監査ログ・写真メタ・ステータス履歴を Postgres 上に一元化する。
- 行レベルセキュリティ (RLS) を厳格化し、管理者 (admin) と作業者 (worker) の権限を明確に分離する。
- Supabase Storage と連携するメディア系オブジェクトは「パス + メタデータ」を DB に保持し、アプリは署名付き URL を介してアクセスする。

## エンティティ概要

| 区分           | エンティティ                             | 目的 / 補足                                                                                           |
| -------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 認証           | `profiles`                               | Supabase Auth ユーザーの拡張属性とロール (`admin` / `worker`) を保持。                                |
| マップ         | `areas`, `floors`, `locations`           | 建物 (Area) → フロア (Floor) → ピン座標 (Location) を管理。Location は相対座標 (0–1) とラベルを保持。 |
| タスク         | `tasks`, `task_items`                    | 運搬タスクと構成物品。タスク/アイテム双方にステータス、担当者、ノートなどを定義。                     |
| 写真           | `task_item_photos`                       | Storage オブジェクトへの参照 (`storage_path`) と MIME/サイズ/キャプションを保持。                     |
| 問題報告       | `task_item_issues`                       | 物品に紐づくインシデント (紛失/破損/その他) と対応履歴。                                              |
| ログ           | `activity_logs`                          | フロント側 `LogEvent` を忠実に保持した監査ログ。Postgres Enum でイベント種別を固定。                  |
| お知らせ       | `announcements`, `announcement_audience` | ホーム画面向けの告知と既読管理。`scope` が `task` の場合は対象タスク必須。                            |
| ユーティリティ | `app_is_admin()` ほか                    | RLS / トリガー用の補助関数。`touch_updated_at` で `updated_at` を一括管理。                           |

> **スキーマ整合性**
>
> - `task_status`, `item_status`, `issue_kind`, `issue_status`, `activity_event_type` を Postgres Enum で定義し、フロントの型 (`src/types/app.ts`) と完全一致させています。
> - `task_items` には `pickup_location_id` / `dropoff_location_id` を保持し、`Item.pin` を生成する際は `locations → floors → areas` を辿ることで `areaId` / `floorId` / 相対座標を復元できます。

## 実行用 SQL スクリプト

Supabase CLI から適用できる完全版スキーマおよび RLS 定義は `supabase/migrations/20251008000000_app_schema.sql` に収録しています。新規プロジェクトで適用する場合は次のコマンドを利用します。

```bash
pnpm supabase db reset
```

同ファイル内では以下の順序で定義しています。

1. 必要拡張 (`pgcrypto`) と Enum 型定義
2. テーブル本体・制約・コメント
3. 更新時刻トリガーおよびステータス履歴トリガー
4. RLS 有効化とポリシー
5. 補助インデックス

## 主な RLS ポリシー方針

| テーブル                       | SELECT                            | INSERT                                 | UPDATE                                      | DELETE               |
| ------------------------------ | --------------------------------- | -------------------------------------- | ------------------------------------------- | -------------------- |
| `profiles`                     | 本人のみ / admin                  | 本人 (id=auth.uid) / admin             | 本人 / admin                                | admin のみ           |
| `areas`, `floors`, `locations` | 認証済み全員                      | admin                                  | admin                                       | admin                |
| `tasks`                        | 認証済み全員                      | admin または `created_by = auth.uid()` | admin または作成者                          | admin または作成者   |
| `task_items`                   | 認証済み全員                      | admin またはタスク作成者               | admin / タスク作成者 / 自分が担当のアイテム | admin / タスク作成者 |
| `task_item_photos`             | 認証済み全員                      | admin / タスク作成者 / 担当者          | 同左                                        | admin / タスク作成者 |
| `task_item_issues`             | 認証済み全員                      | 報告者本人 / admin                     | 報告者本人 / admin                          | admin                |
| `activity_logs`                | admin のみ                        | サービスロールのみ                     | なし                                        | なし                 |
| `announcements`                | 認証済み全員                      | admin                                  | admin                                       | admin                |
| `announcement_audience`        | (`profile_id = auth.uid`) / admin | admin                                  | 本人 (`profile_id = auth.uid`) / admin      | admin                |

これらのポリシーは Supabase Dashboard の Auth Claim (`role`, `sub`) を利用しており、認証済みユーザー以外 (anon) からのアクセスは拒否されます。

## 今後の追加タスク候補

- Realtime チャンネルを利用し、`task_items` / `activity_logs` の更新を購読する。
- Supabase Storage バケット (`item-photos`) 用の RLS ポリシーと MIME/サイズバリデーションを `storage_policies.sql` として追加する。
- `activity_logs` の自動生成を支援する RPC (`public.log_task_event(...)`) を整備し、複数テーブル更新のトランザクションを簡略化する。
- `doc/db-mapping.md` に Supabase 型 (`src/types/supabase.ts`) とアプリ型のマッピング表を記載し、将来のスキーマ変更を追跡しやすくする。
