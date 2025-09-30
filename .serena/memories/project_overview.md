# Project Overview: half-and-half

## Purpose
"half-and-half" は Next.js 15 と Supabase を使用した認証機能を持つフルスタックWebアプリケーションです。ユーザー認証、保護されたルート、リアルタイムプレゼンス機能などを提供します。

## Tech Stack

### Frontend
- **Next.js 15.5.4** - React フレームワーク（App Router使用）
- **React 19.1.0** - UI ライブラリ
- **TypeScript 5** - 型安全性
- **Tailwind CSS 4** - スタイリング
- **Radix UI** - アクセシブルなUIコンポーネント
- **shadcn/ui** - UIコンポーネントライブラリ
- **next-themes** - ダークモード対応
- **React Hook Form** - フォーム管理
- **Zod** - スキーマバリデーション

### Backend & Database
- **Supabase** - Backend as a Service（認証、データベース、リアルタイム機能）
- **@supabase/ssr** - Supabase SSRサポート
- **PostgreSQL 17** - データベース（Supabaseで管理）

### Development Tools
- **Ultracite 5.4.4** - Biomeベースのリンター/フォーマッター
- **Vitest** - テストフレームワーク
- **Lefthook** - Git hooks管理
- **pnpm 10.17.1** - パッケージマネージャー
- **Docker & Docker Compose** - コンテナ化

### Build & Deployment
- **Turbopack** - 高速ビルド（Next.js統合）
- **Cloudflare Tunnel** - 本番環境のトンネリング（オプション）

## Project Structure

```
/src
  /app              - Next.js App Router ページ
    /auth           - 認証関連ページ（login, sign-up, forgot-password, etc.）
    /protected      - 認証が必要なページ
  /components       - React コンポーネント
    /ui             - shadcn/ui コンポーネント（Ultraciteチェックから除外）
  /hooks            - カスタムReactフック
  /lib              - ユーティリティとライブラリ
    /supabase       - Supabase クライアント設定
  /types            - TypeScript 型定義
/supabase           - Supabase設定とマイグレーション
/public             - 静的アセット
```

## Key Features
- ユーザー認証（サインアップ、ログイン、パスワードリセット）
- SSRとクライアントサイドレンダリングの両方でのSupabase統合
- 保護されたルート
- リアルタイムプレゼンス機能（アバタースタック）
- テーマ切り替え（ライト/ダーク）
- アクセシビリティ重視のUI
