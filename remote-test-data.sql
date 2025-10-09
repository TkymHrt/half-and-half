-- リモートSupabase用テストデータ
-- エリア情報を挿入
INSERT INTO public.areas (id, name, description) VALUES 
(gen_random_uuid(), '配置図', '大学祭の配置図面');

-- 変数を使ってエリアIDを参照
DO $$
DECLARE
    area_id uuid;
    floor1_id uuid := gen_random_uuid();
    floor2_id uuid := gen_random_uuid();
    floor3_id uuid := gen_random_uuid();
    floor4_id uuid := gen_random_uuid();
BEGIN
    -- エリアIDを取得
    SELECT id INTO area_id FROM public.areas WHERE name = '配置図' LIMIT 1;
    
    -- フロア情報を挿入
    INSERT INTO public.floors (id, area_id, name, image_path, width_px, height_px, order_index) VALUES 
    (floor1_id, area_id, 'メイン図面 (1/4)', '/maps/R5_校内見取り図_pages-to-jpg-0001.jpg', 4961, 3508, 1),
    (floor2_id, area_id, 'メイン図面 (2/4)', '/maps/R5_校内見取り図_pages-to-jpg-0002.jpg', 4961, 3508, 2),
    (floor3_id, area_id, 'メイン図面 (3/4)', '/maps/R5_校内見取り図_pages-to-jpg-0003.jpg', 4961, 3508, 3),
    (floor4_id, area_id, 'メイン図面 (4/4)', '/maps/R5_校内見取り図_pages-to-jpg-0004.jpg', 4961, 3508, 4);
    
    -- ロケーション情報を挿入
    INSERT INTO public.locations (id, floor_id, label, kind, coord_x, coord_y) VALUES 
    (gen_random_uuid(), floor1_id, '体育館', 'destination', 0.3, 0.4),
    (gen_random_uuid(), floor1_id, '倉庫', 'storage', 0.7, 0.6),
    (gen_random_uuid(), floor2_id, '学生会館', 'destination', 0.5, 0.3),
    (gen_random_uuid(), floor3_id, '第1会議室', 'destination', 0.2, 0.7),
    (gen_random_uuid(), floor4_id, '第2倉庫', 'storage', 0.8, 0.2);
END$$;

-- テスト用ユーザーを作成
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'f6f6ad86-28b8-4c7b-bb1d-d6e5bb3e7acd',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  '2025-01-01 00:00:00+00',
  '2025-01-01 00:00:00+00',
  '2025-01-01 00:00:00+00',
  '{"provider":"email","providers":["email"]}',
  '{}',
  '2025-01-01 00:00:00+00',
  '2025-01-01 00:00:00+00',
  '',
  '',
  '',
  ''
);

-- プロフィールテーブルにレコードを追加
INSERT INTO public.profiles (id, full_name, role) VALUES
('f6f6ad86-28b8-4c7b-bb1d-d6e5bb3e7acd', 'テストユーザー', 'admin');