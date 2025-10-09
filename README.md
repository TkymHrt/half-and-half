## Half & Half – 文化祭運営ダッシュボード

大学の文化祭実行委員会が、準備から当日の運営、片付けまでをスムーズに進めるための業務支援アプリです。ホーム / タスク / マップ / ログの 4 画面で構成され、物品移動や問題報告の状況をリアルタイムに共有できます。

主な特徴:

- 📊 ダッシュボードで全体進捗と最新のお知らせを把握
- ✅ タスク作成モーダルで物品・配置場所をまとめて登録
- 🗺️ 校内図面を利用したマップ表示とピン操作
- 📝 ログ＆問題報告で現場の声を記録

---

## セットアップ

### 必要なツール

- [Node.js 20+](https://nodejs.org/) / [pnpm 8+](https://pnpm.io/)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 初期設定

```bash
# 依存関係をインストール
pnpm install

# 環境変数テンプレートをコピー
cp .env.example .env.local
# Supabase CLI 用に `.env` が必要な場合は同様にコピー
cp .env.example .env

# ローカルの Supabase を起動（必要なとき）
pnpm db:start

# 開発サーバーを起動
pnpm dev
```

アプリは <http://localhost:3000> で確認できます。Supabase を利用する場合は Project Settings > API にある URL と鍵を `.env.local` / `.env` に設定してください。秘密情報は絶対に git にコミットしないでください。

> Supabase を停止する際は `pnpm db:stop` を使用します。データをリセットしたい場合は `pnpm db:reset` を実行してください。

---

## プロジェクト構成

- `src/app/protected` – 認証後に閲覧できる 4 画面
- `src/components/app` – 共通 UI コンポーネントとモーダル群
- `src/lib/mock` – ローカルストレージを利用したモック Repository
- `src/types` – ドメイン型定義
- `doc/` – システム設計書・MVP・タスクリスト

---

## 品質チェック

```bash
# Biome による静的解析
pnpm check

# 自動整形＋軽微な修正
pnpm fix

# 単体テスト
pnpm test
```

---

## Supabase 操作用スクリプト

`package.json` に Supabase CLI をラップした npm script を用意しています。

| コマンド        | 説明                                |
| --------------- | ----------------------------------- |
| `pnpm db:start` | Supabase のローカル環境を起動       |
| `pnpm db:stop`  | Supabase を停止（バックアップなし） |
| `pnpm db:reset` | マイグレーション適用 + シード投入   |
| `pnpm db:diff`  | スキーマ差分を出力                  |
| `pnpm db:push`  | スキーマをリモートへ反映            |
| `pnpm db:types` | Supabase 型定義を生成               |

---

## ライセンス / コントリビュート

現時点では学内利用を想定した非公開プロジェクトです。バグ報告や改善案があれば issue や Slack で共有してください。
