-- モックユーザー用のauth.usersレコード
-- 注意: Supabase Authで作成するのが本来だが、
-- 開発用に直接挿入する

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@example.com',
  '',
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- プロフィール
INSERT INTO profiles (id, email, role, display_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@example.com',
  'teacher',
  '開発用講師'
) ON CONFLICT (id) DO NOTHING;

-- 講師情報
INSERT INTO teachers (user_id, school_name, subject)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '開発用教室',
  '音楽'
) ON CONFLICT (user_id) DO NOTHING;
