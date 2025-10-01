# Task Completion Checklist

タスク完了時には、以下の手順を実行してください:

## 1. Code Quality Check
```bash
pnpm check
```
- Ultraciteでリントエラーがないか確認
- 警告やエラーがある場合は修正

## 2. Auto-fix Issues
```bash
pnpm fix
```
- 自動修正可能な問題を修正
- フォーマットの統一

## 3. Type Check
TypeScriptの型エラーを確認:
```bash
npx tsc --noEmit
```
または、VSCodeのProblemsパネルで型エラーを確認

## 4. Run Tests
```bash
pnpm test
```
- 既存のテストが全て通過することを確認
- 新機能を追加した場合は対応するテストも追加

## 5. Database Schema Changes
データベーススキーマを変更した場合:

### 新しいマイグレーションを作成
```bash
pnpm migrate:new <migration_name>
```

### または、差分から自動生成
```bash
pnpm db:diff -f <migration_name>
```

### TypeScript型を再生成
```bash
pnpm db:types
```
これにより `src/types/supabase.ts` が更新されます

## 6. Build Check
本番ビルドが成功することを確認:
```bash
pnpm build
```

## 7. Git Commit
Lefthook が pre-commit フックで自動的に `ultracite fix` を実行します:
```bash
git add .
git commit -m "feat: your commit message"
```

コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式を推奨:
- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメント変更
- `style:` - コードスタイル変更（機能に影響なし）
- `refactor:` - リファクタリング
- `test:` - テスト追加・修正
- `chore:` - ビルドプロセスや補助ツールの変更

## 8. Environment Variables Check
新しい環境変数を追加した場合:
- `.env.local.example` を更新（存在する場合）
- READMEまたはドキュメントに記載
- チームメンバーに通知

## 9. Supabase Specific Tasks

### 認証関連の変更
- 認証フローが正常に動作することを確認
- `/auth/*` ルートをテスト
- ミドルウェアでのセッション管理を確認

### データベース変更
- ローカルで `pnpm db:reset` を実行してマイグレーションをテスト
- RLS (Row Level Security) ポリシーを確認
- データベース型が正しく生成されているか確認

## 10. Accessibility Check
アクセシビリティ要件を満たしているか確認:
- キーボードナビゲーションが機能する
- スクリーンリーダーで正しく読み上げられる
- ARIA属性が適切に設定されている
- コントラスト比が十分である

## Quick Checklist
実行済みチェックリスト:
- [ ] `pnpm check` が成功
- [ ] `pnpm fix` で自動修正
- [ ] 型エラーなし
- [ ] テストが通過
- [ ] データベース型を再生成（スキーマ変更時）
- [ ] `pnpm build` が成功
- [ ] Git commit（Lefthook自動実行）
- [ ] 環境変数を文書化（新規追加時）
- [ ] アクセシビリティ要件を満たす

## Additional Notes
- **重要**: `src/components/ui/` 内のファイルは shadcn/ui で生成されたものなので、基本的に編集しないでください
- データベースマイグレーションは常にバージョン管理に含める
- Supabaseの型定義は手動で編集せず、`pnpm db:types` で生成する
