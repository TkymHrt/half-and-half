-- リモートSupabase用テストユーザー作成
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
  '$2a$10$AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqr',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- プロフィールテーブルにレコードを追加
INSERT INTO public.profiles (id, full_name, role) VALUES
('f6f6ad86-28b8-4c7b-bb1d-d6e5bb3e7acd', 'テストユーザー', 'admin')
ON CONFLICT (id) DO NOTHING;