# Architecture and Design Patterns

## Application Architecture

### Next.js App Router Structure
プロジェクトはNext.js 15のApp Routerを使用しており、以下の構造になっています:

```
/src/app
  layout.tsx          - ルートレイアウト（全ページ共通）
  page.tsx            - ホームページ
  /auth               - 認証関連ルート（public）
    /login
    /sign-up
    /forgot-password
    /update-password
    /error
    /confirm          - Email confirmation callback
  /protected          - 認証が必要なルート
    layout.tsx        - 認証チェックを含むレイアウト
    page.tsx
```

### Rendering Strategy
- **Server Components (デフォルト)**: データフェッチングと初期レンダリング
- **Client Components**: インタラクティブな UI、状態管理、ブラウザAPIの使用
- **Middleware**: 全リクエストでセッション管理とリダイレクト

## Supabase Integration Patterns

### 1. Server-Side Client (Server Components & API Routes)
```typescript
// src/lib/supabase/server.ts
import { createClient } from "@/lib/supabase/server";

export async function ServerComponent() {
  const supabase = await createClient();
  // Always create new client per request
  const { data } = await supabase.from("table").select();
  return <div>{data}</div>;
}
```

**重要**: サーバーサイドクライアントはグローバル変数に保存しない（Fluid computeのため）

### 2. Client-Side Client (Client Components)
```typescript
// src/lib/supabase/client.ts
import { createClient } from "@/lib/supabase/client";

"use client";
export function ClientComponent() {
  const supabase = createClient();
  // Use in effects, event handlers, etc.
}
```

### 3. Middleware Pattern
```typescript
// middleware.ts
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```
- 全リクエストでセッションをチェック・更新
- 未認証ユーザーを `/auth/login` にリダイレクト
- 静的ファイル、画像は除外

## Authentication Flow

### Sign Up Flow
1. ユーザーがフォームに入力 → `SignUpForm` component
2. Supabase Auth APIでユーザー作成
3. Email確認リンク送信
4. `/auth/confirm` ルートでトークン検証
5. `/auth/sign-up-success` に遷移

### Login Flow
1. Email/パスワード入力 → `LoginForm` component
2. `supabase.auth.signInWithPassword()`
3. セッション確立
4. Middleware がクッキーに保存
5. `/protected` にリダイレクト

### Password Reset Flow
1. Email入力 → `ForgotPasswordForm`
2. リセットリンク送信
3. リンククリック → `/auth/update-password`
4. 新パスワード設定 → `UpdatePasswordForm`

## Component Patterns

### Form Components
- **React Hook Form** + **Zod** でバリデーション
- UI コンポーネントは shadcn/ui の Form components を使用
- エラーハンドリングは統一的に実装

### UI Component Library (shadcn/ui)
- `src/components/ui/` にRadix UI ベースのコンポーネント
- **重要**: これらは自動生成されたファイルなので、直接編集しない
- カスタマイズが必要な場合は、ラッパーコンポーネントを作成

### Custom Hooks Pattern
```typescript
// src/hooks/use-current-user-name.ts
export function useCurrentUserName() {
  const [name, setName] = useState<string | null>(null);
  // Custom logic
  return name;
}
```

## Realtime Features
プロジェクトにはリアルタイムプレゼンス機能が含まれています:
- `useRealtimePresenceRoom` フック
- `RealtimeAvatarStack` コンポーネント
- Supabase Realtime Channels使用

## State Management
- **Server State**: React Server Components で直接データフェッチ
- **Client State**: React Hooks (useState, useEffect)
- **Form State**: React Hook Form
- **Global State**: Context API（必要に応じて）

## Styling Architecture
- **Tailwind CSS 4**: ユーティリティファーストCSS
- **CSS Variables**: テーマ対応（light/dark）
- **cn() utility**: clsx + tailwind-merge でクラス結合
- **CVA (class-variance-authority)**: コンポーネントバリアント管理

## Error Handling Strategy
1. **Try-Catch Blocks**: 全ての非同期操作
2. **Error Pages**: `/auth/error` で認証エラー表示
3. **Toast Notifications**: ユーザーフィードバック（Sonner）
4. **Validation Errors**: Zod スキーマでフォームバリデーション

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL              - Supabase プロジェクトURL (public)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY - Supabase anon key (public)
```

## Performance Considerations
- **Turbopack**: 開発・ビルド時の高速化
- **Standalone Output**: Docker最適化された本番ビルド
- **Image Optimization**: Next.js Image component使用
- **Code Splitting**: 自動的にページごとに分割

## Security Patterns
- **Row Level Security (RLS)**: Supabaseで実装
- **Environment Variables**: 機密情報は環境変数で管理
- **CSRF Protection**: Next.js + Supabase SSR で自動処理
- **XSS Prevention**: React の自動エスケープ

## Testing Strategy
- **Vitest**: ユニット・統合テスト
- **@testing-library/react**: コンポーネントテスト
- **jsdom**: DOM環境シミュレーション

## Docker & Deployment
- **Multi-stage Build**: 最適化されたDockerイメージ
- **Development Profile**: ホットリロード開発環境
- **Production Profile**: Cloudflare Tunnel統合
- **Standalone Output**: 必要最小限のファイルのみデプロイ
