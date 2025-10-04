# 実装タスクチェックリスト

## プロジェクト基盤

- [ ] `biome.jsonc` と既存ルールを確認し、コーディング規約と a11y 要件を共有する
- [ ] 必要な依存関係（`react-leaflet` / `leaflet` / `zustand` / `lucide-react` / `zod` / `idb-keyval`）を追加し、`pnpm-lock.yaml` を更新する
- [ ] Leaflet のスタイルを `app/globals.css` に取り込み、他スタイルへの影響を確認する
- [ ] Supabase 連携を見据えた `.env` テンプレートを整備し、秘密情報をコミットしない手順を記載する

## ルーティング & レイアウト

- [ ] `app/protected/layout.tsx` を作成し、共通ヘッダーと下部ナビゲーションを組み込む
- [ ] `app/protected/(app)/home/page.tsx` を追加し、保護エリア遷移後のホーム画面を実線化する
- [ ] `app/protected/(app)/tasks/page.tsx` と `app/protected/(app)/tasks/[taskId]/page.tsx` を追加する
- [ ] `app/protected/(app)/map/page.tsx` とマップ関連のルーティングを構築する
- [ ] `app/protected/(app)/logs/page.tsx` を追加し、ヘッダーの「問題報告」ボタンでモーダルを表示できるようにする

## 共通 UI コンポーネント

- [ ] `components/app/header.tsx` を実装し、タイトルとコンテキストに応じたアクションボタンを表示する
- [ ] `components/app/bottom-nav.tsx` を実装し、現在のパスをハイライトするタブ切替を提供する
- [ ] `components/app/task-create-dialog.tsx` を実装し、3 ステップ（タスク情報 → 物品追加 → ピン配置）でタスク作成を完了できるようにする
- [ ] `components/app/issue-report-dialog.tsx` を実装し、ログ画面から問題報告を登録できるようにする
- [ ] shadcn/ui ベースのフォーム・テーブル・カード等の共通パターンを整備し、再利用できるようにする

## モックデータ & 状態管理

- [ ] `types/app.ts` にドメイン型（Task / Item / Area / Floor / LogEvent / Issue 等）を定義する
- [ ] `lib/mock/storage.ts` を実装し、localStorage や IndexedDB 抽象を提供する
- [ ] `lib/mock/repositories/tasks.ts`・`items.ts`・`logs.ts`・`issues.ts`・`areas.ts` を作成し、Promise ベースの CRUD API を用意する
- [ ] `lib/mock/index.ts` にシードデータ投入処理 `ensureSeed()` を実装し、初回ロード時にデータを生成する
- [ ] `lib/store/app-store.ts` を作成し、タイトルやログ既読状態など UI ステートを管理する
- [ ] Repository 呼び出しとログ記録をまとめるユーティリティを実装する

## ホーム画面

- [ ] タスクと物品から進捗サマリー（未着手・進行中・完了）を集計して表示する
- [ ] 未対応の問題件数を取得し、タップ時にログ画面へ遷移させる
- [ ] `LogEvent` の最新エントリを「お知らせ」として時系列リスト表示する
- [ ] ホーム表示時に UI ストアの `lastSeenLogAt` を更新し、既読管理を行う

## タスク一覧 & 詳細

- [ ] タスク一覧テーブルでタイトル/担当者検索とステータスフィルタを実装する
- [ ] タスク行クリックでタスク詳細ページへ遷移できるようにする
- [ ] タスク詳細ページで基本情報と物品一覧を表示する
- [ ] 物品ステータス更新（`unplaced`→`moving`→`placed`）時にログを追記し、UI を再描画する
- [ ] 物品詳細ドロワーで写真添付と配置完了報告を受け付ける
- [ ] タスク作成モーダル完了時に一覧とログへ即時反映し、通知を表示する

## マップ機能

- [ ] `components/app/map/floor-map.tsx` を実装し、`react-leaflet` + `CRS.Simple` で画像マップを表示する
- [ ] RelativeXY 座標を Leaflet 座標へ変換するヘルパーを実装する
- [ ] エリア・フロア切替 UI を提供し、対応する画像とピンを読み込む
- [ ] 物品ステータスに応じたピンの色/アイコン分岐と凡例 (`components/app/map/pin-legend.tsx`) を実装する
- [ ] ピンタップ時に該当物品リストをポップオーバー/ドロワーで表示する
- [ ] マップ画面と一覧画面を連携し、場所情報選択時に該当マップとピンへフォーカスする
- [ ] タスク作成モーダルのピン配置ステップで、クリック位置を 0..1 の正規化座標として保存する

## ログ & 問題報告

- [ ] `LogEvent` 一覧を新着順でカード表示し、疑似無限スクロールでページングする
- [ ] 問題報告モーダルから Issue を登録し、ログへ `issue_reported` イベントを追加する
- [ ] Issue ステータス変更（`open` ↔ `resolved`）を管理者が行えるよう UI と処理を実装する
- [ ] ログ検索/フィルタ（キーワード・日付）を実装する

## 写真添付 & ストレージ

- [ ] 物品詳細で `input type="file" capture="environment"` を利用した写真アップロードを実装する
- [ ] ローカル保存のために IndexedDB (`idb-keyval`) を採用し、写真 ID と URL を紐付ける
- [ ] 写真アップロード完了時にプレビュー表示とログ記録 (`item_photo_uploaded`) を行う

## 追加 UX / アクセシビリティ

- [ ] a11y ガードラインに従って、全ボタンに `type` を付与し、キーボード操作に対応させる
- [ ] モーダルやドロワーのフォーカスマネジメントとエスケープクローズを確認する
- [ ] マップピンやボタンに対するアクセシブルなラベル/説明を付与する
- [ ] タッチデバイスでのピン配置とスクロールの操作性を検証する

## QA / 検証

- [ ] ページごとにユニットテストまたはコンポーネントテスト（Vitest + React Testing Library）を整備する
- [ ] 進捗サマリーやログ更新など主要ユースケースを E2E で手動検証する
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` を CI 相当で実行し、失敗時に修正する
- [ ] 初回ロードから各フロー（タスク作成 → 配置 → 写真添付 → 問題報告）が通ることを確認し、既知の課題を記録する

## 将来拡張の準備タスク

- [ ] Supabase への差し替えを想定した Repository インターフェースの抽象化ガイドを作成する
- [ ] Supabase テーブル設計（tasks / items / item_pins / areas / floors / logs / issues）をドキュメント化する
- [ ] RLS ポリシーとロール別アクセス要件を整理し、別ドキュメントへ反映する
