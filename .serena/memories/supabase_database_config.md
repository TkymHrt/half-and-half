# Supabase Configuration and Database

## Supabase Setup

### Local Development Environment
Supabase CLI を使用してローカル開発環境を構築:

```bash
pnpm db:start    # Supabase services を起動
pnpm db:status   # 起動状態を確認
pnpm db:stop     # Supabase services を停止
```

### Services and Ports
ローカルSupabaseは以下のポートで起動:
- **API**: http://127.0.0.1:54321
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Studio**: http://127.0.0.1:54323
- **Inbucket (Email Testing)**: http://127.0.0.1:54324

### Database Configuration
- **PostgreSQL Version**: 17
- **Shadow Port**: 54320 (マイグレーション差分用)
- **Max Rows**: 1000 (API response limit)
- **Schemas**: `public`, `graphql_public`

## Authentication Configuration

### Email Auth Settings
- **Signup Enabled**: Yes
- **Email Confirmations**: Disabled (開発用)
- **Double Confirm Changes**: Yes
- **OTP Length**: 6 digits
- **OTP Expiry**: 3600 seconds (1 hour)

### Session Settings
- **JWT Expiry**: 3600 seconds (1 hour)
- **Refresh Token Rotation**: Enabled
- **Refresh Token Reuse Interval**: 10 seconds

### Site URLs
- **Local**: http://127.0.0.1:3000
- **Additional Redirect URLs**: https://127.0.0.1:3000

### Rate Limiting
- **Sign-in/Sign-ups**: 30 requests per 5 minutes per IP
- **Token Refresh**: 150 requests per 5 minutes per IP
- **Email Sent**: 2 emails per hour

## Migration Management

### Creating Migrations
```bash
# 新しいマイグレーションファイルを作成
pnpm migrate:new <migration_name>

# 差分から自動生成
pnpm db:diff -f <migration_name>
```

マイグレーションファイルは `supabase/migrations/` に保存されます。

### Applying Migrations
```bash
# 未適用のマイグレーションを実行
pnpm migrate:up

# データベースをリセット（全マイグレーション再実行）
pnpm db:reset
```

### Migration Best Practices
1. マイグレーションは常にバージョン管理に含める
2. 本番適用前にローカルでテスト
3. ロールバックプランを用意
4. データ移行は慎重に

## Database Schema Pattern

### RLS (Row Level Security)
Supabaseのセキュリティはテーブルレベルのポリシーで管理:
```sql
-- Example: Users can only read their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### Type Generation
データベーススキーマから TypeScript型を自動生成:
```bash
pnpm db:types
```
生成先: `src/types/supabase.ts`

**重要**: このファイルは手動で編集せず、常に自動生成すること

## Seeding

### Seed Configuration
- **Enabled**: Yes
- **Seed File**: `supabase/seed.sql`

### Creating Seed Data
```bash
# 現在のローカルDBデータをseed.sqlにダンプ
pnpm db:dump
```

### Applying Seeds
```bash
# db:reset 実行時に自動的にシードが適用される
pnpm db:reset
```

## Realtime Configuration
- **Enabled**: Yes
- **IP Version**: IPv4
- **Max Header Length**: 4096 bytes

リアルタイム機能はプレゼンス、ブロードキャスト、データベース変更の購読に使用

## Storage Configuration
- **Enabled**: Yes
- **File Size Limit**: 50MiB
- **Image Transformation**: Disabled (Pro plan feature)

## Studio Configuration
- **Port**: 54323
- **API URL**: http://127.0.0.1
- **OpenAI Integration**: 環境変数で設定可能 (`OPENAI_API_KEY`)

## Remote Database Operations

### Pulling Remote Schema
```bash
pnpm db:pull
```
リモートのスキーマをローカルにプル

### Pushing Local Schema
```bash
pnpm db:push
```
ローカルのマイグレーションをリモートにプッシュ

**注意**: 本番環境への push は慎重に実行

## Environment Variables for Database
Supabase接続に必要な環境変数:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<anon_key>
```

ローカル開発では `pnpm db:start` 後に自動的に設定される

## Troubleshooting

### Database Connection Issues
```bash
# Supabase status確認
pnpm db:status

# ログ確認
supabase logs db

# 完全リセット
pnpm db:stop
pnpm db:start
```

### Migration Conflicts
```bash
# マイグレーション履歴確認
pnpm migrate:list

# 問題がある場合はリセット
pnpm db:reset
```

## Testing Email Locally
Inbucket（メールテストサーバー）を使用:
- URL: http://127.0.0.1:54324
- 送信されたメールはここで確認可能
- 実際にはメール送信されない
