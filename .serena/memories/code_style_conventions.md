# Code Style and Conventions

## Overview
このプロジェクトは **Ultracite** (Biomeベースのリンター/フォーマッター) を使用して、厳格な型安全性、アクセシビリティ基準、一貫したコード品質を強制しています。

## Key Principles
1. **Zero Configuration** - 設定不要
2. **Subsecond Performance** - 高速なリント/フォーマット
3. **Maximum Type Safety** - 厳格な型チェック
4. **AI-friendly Code Generation** - AIによるコード生成に最適化

## TypeScript Configuration
- **Strict Mode**: 有効
- **Target**: ES2017
- **Module Resolution**: bundler
- **JSX**: preserve
- **Strict Null Checks**: 有効
- **Path Aliases**: `@/*` → `./src/*`

## Naming Conventions

### Files and Directories
- **Components**: kebab-case (例: `login-form.tsx`, `auth-button.tsx`)
- **Pages**: kebab-case (Next.js App Router規約)
- **Hooks**: kebab-case with `use-` prefix (例: `use-current-user-name.ts`)
- **Utilities**: kebab-case (例: `utils.ts`)
- **Types**: kebab-case (例: `global.d.ts`)

### Code
- **Components**: PascalCase (例: `LoginForm`, `AuthButton`)
- **Functions**: camelCase (例: `createClient`, `hasEnvVars`)
- **Constants**: camelCase (例: `defaultUrl`, `geistSans`)
- **Types/Interfaces**: PascalCase (TypeScript標準)

## React/Next.js Patterns

### Component Structure
```typescript
// ✅ Good: Named export, arrow function
export function ComponentName({ prop1, prop2 }: Props) {
  return <div>...</div>;
}

// ❌ Bad: Default export
export default function ComponentName() { ... }
```

### Async Components (Server Components)
```typescript
// ✅ Good: Server Component with async/await
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Client Components
```typescript
// ✅ Good: Use 'use client' directive at the top
"use client";

import { useState } from "react";

export function ClientComponent() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### Supabase Client Pattern
```typescript
// Server Components - Always create new client
import { createClient } from "@/lib/supabase/server";

export async function ServerComponent() {
  const supabase = await createClient();
  const { data } = await supabase.from("table").select();
  return <div>...</div>;
}

// Client Components - Create client in component
import { createClient } from "@/lib/supabase/client";

export function ClientComponent() {
  const supabase = createClient();
  // Use supabase...
}
```

## Styling Conventions

### Tailwind CSS Usage
```typescript
// ✅ Good: Use cn() utility for conditional classes
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  condition && "conditional-class",
  variant === "primary" && "primary-class"
)} />

// ❌ Bad: String concatenation
<div className={"base " + (condition ? "conditional" : "")} />
```

### Component Props with Variants
```typescript
// ✅ Good: Use class-variance-authority for variants
import { cva } from "class-variance-authority";

const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "default-classes",
      primary: "primary-classes",
    },
  },
});
```

## Error Handling
```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await fetchData();
  return { success: true, data: result };
} catch (error) {
  console.error('API call failed:', error);
  return { success: false, error: error.message };
}

// ❌ Bad: Swallowing errors
try {
  return await fetchData();
} catch (e) {
  console.log(e);
}
```

## Accessibility (a11y) Requirements
- 全てのインタラクティブ要素に適切なARIA属性を付与
- ボタンには必ず `type` 属性を指定
- 画像には意味のある `alt` テキストを提供
- フォームラベルは対応する入力要素と関連付け
- キーボード操作をサポート（onClick には onKeyUp/Down も追加）

## Import Organization
```typescript
// 1. External dependencies
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 2. Internal absolute imports (using @ alias)
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// 3. Relative imports (if needed)
import { helper } from "./helper";

// 4. Type imports (separate)
import type { NextRequest } from "next/server";
```

## Comments and Documentation
- JSDocコメントは簡潔に
- 複雑なロジックには説明コメントを追加
- TODOコメントは避け、Issueトラッカーを使用

## Files Excluded from Linting
以下のファイルは `biome.jsonc` で Ultracite チェックから除外されています:
- `src/components/ui/**/*.tsx` (shadcn/ui生成コンポーネント)
- `src/hooks/use-mobile.ts` (サードパーティフック)
- `src/lib/supabase/*` (Supabaseボイラープレート)
