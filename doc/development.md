# 開発ガイド

このドキュメントは、ローカル開発環境のセットアップ、ビルド／テスト、Docker を使った起動方法、コーディングルールなどを簡潔にまとめたものです。

## 目次

- 前提と推奨環境
- 開発環境の起動（Docker 推奨）
- ローカルでのセットアップ（オプション）
- 依存関係と環境変数
- ビルド・テスト・品質チェック
- Docker の使い方（dev / prod）
- コーディングルール（概要）
- プロジェクト構成
- Git フックとデプロイ

## 前提と推奨環境

- 必須: Docker（推奨）
- ローカルで開発する場合: Node.js, pnpm（Docker を利用するなら不要）

このリポジトリは Docker ベースでの開発を推奨しています。コンテナを使うことで環境差異を排除できます。

## 開発環境の起動（Docker）

Docker がインストールされている場合、素早く開発環境を立ち上げられます：

```bash
# リポジトリをクローン
git clone https://github.com/TkymHrt/half-and-half.git
cd half-and-half

# 開発環境を起動（プロファイル: dev）
docker compose --profile dev up
```

コンテナ内で Node.js と pnpm がセットアップされるため、ホストにそれらを入れる必要はありません。

## ローカルでのセットアップ（オプション）

Docker を使わずローカルで開発する場合の最小手順を示します。

1. Node.js のインストール（Volta 推奨）

```bash
# Volta を使って Node.js を管理するのが推奨です
curl https://get.volta.sh | bash
source ~/.zshrc  # 使用シェルに合わせて再読み込み
volta install node
```

2. pnpm のインストール

```bash
volta install pnpm       # 推奨
# または
npm install -g pnpm
```

3. 依存関係のインストール

```bash
pnpm install
```

## 環境変数

ルートに `.env` ファイルを作り、必要な値を入れてください。例：

```env
CLOUDFLARE_TUNNEL_TOKEN=your_token_here
```

## ビルド・テスト・品質チェック

- ビルド:

```bash
pnpm build
```

- テスト:

```bash
pnpm test
```

- コード品質チェック:

```bash
# 問題の検出のみ
pnpm check

# 自動修正
pnpm fix
```

## Docker の使い方

- 開発（バックグラウンド）:

```bash
docker compose --profile dev up -d
```

- 本番（バックグラウンド）:

```bash
docker compose --profile prod up -d
```

- Cloudflare Tunnel を使った公開（本番プロファイル）:

```bash
docker compose --profile prod up
```

## コーディングルール

このプロジェクトは Ultracite（Biome ベース）の厳格なルールセットに従います。ここでは要点だけを示します。詳細は `.github/copilot-instructions.md` を参照してください。

- アクセシビリティ (a11y):
	- `accessKey` を使わない
	- フォーカス可能な要素に `aria-hidden="true"` を設定しない
	- 画像に意味のある alt を設定、SVG に `title` を含めるなど

- TypeScript / 型安全:
	- `any` の使用禁止
	- `enum`, `namespace` の使用制限

- React / JSX:
	- フックはトップレベルで、依存配列は正しく
	- ループのキーにインデックスを使わない

- 一般的な品質ルール:
	- console の使用禁止
	- var の使用禁止
	- 不要なコードや未使用の import を残さない

詳細なチェックリストや自動整形はリポジトリの設定（Biome / Ultracite）で実行されます。

## プロジェクト構成

ルートの主要ディレクトリ:

```
src/
├── app/          # Next.js App Router
├── components/   # React コンポーネント
│   └── ui/       # UI コンポーネント（Radix 等）
├── hooks/        # カスタムフック
├── lib/          # ユーティリティ
└── __tests__/    # テスト

public/           # 静的ファイル
doc/              # このドキュメントなど
```

## Git フック

Lefthook を使ってコミット前にコード品質チェックを走らせています。コミット時に自動で整形とチェックが入るため、CI に入れる前に多くの問題が解決されます。

## デプロイ

本番は Docker Compose を想定しています。Cloudflare Tunnel を使ってプロダクションを公開する設定も可能です。詳細は `compose.yml` と `Dockerfile` を確認してください。

## 補足・参照

- 詳細ルール・自動整形: `.github/copilot-instructions.md`
- 開発フロー・運用の詳細は `doc/` 下の他ファイルを参照してください。
