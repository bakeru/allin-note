-- 開発用の最小データセット
-- mock認証の teacher / school_owner / student で画面確認できるようにする

-- auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'owner@example.com',
    '',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'student@example.com',
    '',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'teacher@example.com',
    '',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- profiles
INSERT INTO profiles (id, email, role, display_name, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'owner@example.com',
    'school_owner',
    '開発用オーナー',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'student@example.com',
    'student',
    '開発用生徒',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'teacher@example.com',
    'teacher',
    '開発用講師',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  status = EXCLUDED.status;

-- school
INSERT INTO schools (
  id,
  name,
  description,
  owner_id,
  subscription_plan,
  subscription_status,
  max_students,
  location_management_enabled,
  buffer_same_location_minutes,
  buffer_same_area_minutes,
  buffer_different_area_minutes,
  cancellation_deadline_hours,
  late_cancellation_policy,
  deleted_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '開発用教室',
  '予約フロー確認用の教室です',
  '00000000-0000-0000-0000-000000000001',
  'light',
  'active',
  30,
  true,
  0,
  30,
  60,
  24,
  'consume',
  null
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  owner_id = EXCLUDED.owner_id,
  subscription_plan = EXCLUDED.subscription_plan,
  subscription_status = EXCLUDED.subscription_status,
  max_students = EXCLUDED.max_students,
  location_management_enabled = EXCLUDED.location_management_enabled,
  buffer_same_location_minutes = EXCLUDED.buffer_same_location_minutes,
  buffer_same_area_minutes = EXCLUDED.buffer_same_area_minutes,
  buffer_different_area_minutes = EXCLUDED.buffer_different_area_minutes,
  cancellation_deadline_hours = EXCLUDED.cancellation_deadline_hours,
  late_cancellation_policy = EXCLUDED.late_cancellation_policy,
  deleted_at = EXCLUDED.deleted_at;

-- school_teachers
INSERT INTO school_teachers (school_id, teacher_id, role)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'owner'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'teacher'
  )
ON CONFLICT (school_id, teacher_id) DO UPDATE SET
  role = EXCLUDED.role;

-- area
INSERT INTO areas (
  id,
  school_id,
  name,
  deleted_at
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '本校エリア',
  null
)
ON CONFLICT (id) DO UPDATE SET
  school_id = EXCLUDED.school_id,
  name = EXCLUDED.name,
  deleted_at = EXCLUDED.deleted_at;

-- location
INSERT INTO locations (
  id,
  school_id,
  area_id,
  name,
  type,
  notes,
  deleted_at
) VALUES (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '本校 A教室',
  'room',
  '開発用の標準教室',
  null
)
ON CONFLICT (id) DO UPDATE SET
  school_id = EXCLUDED.school_id,
  area_id = EXCLUDED.area_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  notes = EXCLUDED.notes,
  deleted_at = EXCLUDED.deleted_at;

-- student
INSERT INTO students (
  user_id,
  teacher_id,
  school_id,
  start_date,
  status,
  notes,
  default_location_id,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  CURRENT_DATE,
  'active',
  '開発用の予約確認データです',
  '30000000-0000-0000-0000-000000000001',
  null
)
ON CONFLICT (user_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  school_id = EXCLUDED.school_id,
  start_date = EXCLUDED.start_date,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  default_location_id = EXCLUDED.default_location_id,
  deleted_at = EXCLUDED.deleted_at;
