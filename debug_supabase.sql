-- Supabaseダッシュボードで実行するSQL診断コマンド

-- 1. テーブル権限の確認
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'task_items', 'areas', 'floors');

-- 2. anon roleの権限確認
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE grantee = 'anon' 
  AND table_schema = 'public'
  AND table_name IN ('tasks', 'task_items', 'areas', 'floors');

-- 3. RLS設定確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'task_items', 'areas', 'floors');

-- 4. 現在のロール確認
SELECT current_user, current_role;

-- 5. テーブルが存在するか確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 6. anonロールへ権限を明示的に付与（実行してみてください）
GRANT ALL ON public.tasks TO anon;
GRANT ALL ON public.task_items TO anon;
GRANT ALL ON public.areas TO anon;
GRANT ALL ON public.floors TO anon;
GRANT ALL ON public.locations TO anon;

-- 6b. authenticatedロールにも権限を付与（重要！）
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.task_items TO authenticated;
GRANT ALL ON public.areas TO authenticated;
GRANT ALL ON public.floors TO authenticated;
GRANT ALL ON public.locations TO authenticated;
-- GRANT ALL ON public.photos TO authenticated;  -- テーブルが存在しない
-- GRANT ALL ON public.issues TO authenticated;  -- テーブルが存在しない可能性
-- GRANT ALL ON public.activity_logs TO authenticated;  -- テーブルが存在しない可能性

-- 6c. シーケンスの権限も付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6d. ログテーブルの権限を追加
GRANT ALL ON public.activity_logs TO anon;
GRANT ALL ON public.activity_logs TO authenticated;

-- 7. パブリックスキーマのデフォルト権限確認
SELECT has_table_privilege('anon', 'public.tasks', 'SELECT') as can_select_tasks;
SELECT has_table_privilege('anon', 'public.tasks', 'INSERT') as can_insert_tasks;