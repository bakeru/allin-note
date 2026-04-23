CREATE TYPE user_role AS ENUM ('teacher', 'student');
CREATE TYPE user_status AS ENUM ('active', 'withdrawn');
CREATE TYPE student_status AS ENUM ('active', 'paused', 'inactive');
CREATE TYPE lesson_status AS ENUM (
  'recording', 'uploading', 'transcribing',
  'summarizing', 'ready', 'sent'
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  display_name TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  withdrawn_at TIMESTAMPTZ,
  scheduled_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);

CREATE TABLE teachers (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(user_id) ON DELETE CASCADE,
  start_date DATE,
  status student_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_teacher ON students(teacher_id);

CREATE TABLE student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(user_id),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  student_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON student_invitations(token);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(user_id),
  student_id UUID NOT NULL REFERENCES students(user_id),
  recorded_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER,

  -- 音声ファイル(R2)
  audio_path TEXT,
  audio_expires_at TIMESTAMPTZ,
  audio_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  -- AI処理の結果
  transcript TEXT,
  summary_for_student JSONB,
  summary_for_teacher JSONB,

  -- ステータス
  status lesson_status NOT NULL DEFAULT 'recording',
  sent_at TIMESTAMPTZ,

  -- 表示制御
  hidden_by_teacher BOOLEAN NOT NULL DEFAULT FALSE,
  hidden_by_student BOOLEAN NOT NULL DEFAULT FALSE,

  -- エラー記録
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX idx_lessons_student ON lessons(student_id);
CREATE INDEX idx_lessons_audio_expires
  ON lessons(audio_expires_at)
  WHERE audio_deleted = FALSE;

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id),
  to_user_id UUID NOT NULL REFERENCES profiles(id),
  lesson_id UUID REFERENCES lessons(id),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_to ON messages(to_user_id);

CREATE TABLE download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  download_type TEXT NOT NULL,
  ip_address INET,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_downloads_user ON download_logs(user_id);

CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  year_month TEXT NOT NULL,
  recording_count INTEGER NOT NULL DEFAULT 0,
  recording_minutes INTEGER NOT NULL DEFAULT 0,
  api_cost_jpy NUMERIC(10,2) DEFAULT 0,
  UNIQUE(user_id, year_month)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のプロフィールのみ
CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- lessons: 講師は自分のレッスン全操作可
CREATE POLICY "teacher_own_lessons" ON lessons
  FOR ALL USING (auth.uid() = teacher_id);

-- lessons: 生徒は送信済みで非表示でない自分のレッスン
CREATE POLICY "student_visible_lessons" ON lessons
  FOR SELECT USING (
    auth.uid() = student_id
    AND sent_at IS NOT NULL
    AND hidden_by_student = FALSE
  );

CREATE POLICY "student_toggle_hidden" ON lessons
  FOR UPDATE USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- students: 講師は自分の生徒のみ
CREATE POLICY "teacher_own_students" ON students
  FOR ALL USING (auth.uid() = teacher_id);

-- students: 生徒は自分のプロフィールのみ閲覧
CREATE POLICY "student_own_profile" ON students
  FOR SELECT USING (auth.uid() = user_id);

-- teachers: 自分のプロフィールのみ
CREATE POLICY "own_teacher_profile" ON teachers
  FOR ALL USING (auth.uid() = user_id);

-- messages: 送受信者のみ
CREATE POLICY "own_messages_select" ON messages
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "send_messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "read_messages" ON messages
  FOR UPDATE USING (auth.uid() = to_user_id);

-- download_logs: 自分のログのみ
CREATE POLICY "own_download_logs" ON download_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_download_logs" ON download_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- usage_stats: 自分の統計のみ
CREATE POLICY "own_usage_stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);
