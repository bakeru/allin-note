CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  subscription_plan TEXT DEFAULT 'light' CHECK (
    subscription_plan IN (
      'light', 'standard', 'plus', 'pro',
      'business', 'enterprise'
    )
  ),
  subscription_status TEXT DEFAULT 'active' CHECK (
    subscription_status IN ('active', 'paused', 'cancelled')
  ),
  max_students INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE school_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'teacher' CHECK (
    role IN ('owner', 'head_teacher', 'teacher')
  ),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, teacher_id)
);

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'school_owner';

ALTER TABLE students
ADD COLUMN school_id UUID REFERENCES schools(id);

CREATE INDEX idx_school_teachers_school
  ON school_teachers(school_id);
CREATE INDEX idx_school_teachers_teacher
  ON school_teachers(teacher_id);
CREATE INDEX idx_students_school
  ON students(school_id);

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_visibility" ON schools
  FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM school_teachers
      WHERE school_id = schools.id
        AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "school_owner_can_modify" ON schools
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "school_teachers_visibility" ON school_teachers
  FOR SELECT USING (
    auth.uid() = teacher_id
    OR EXISTS (
      SELECT 1 FROM schools
      WHERE id = school_teachers.school_id
        AND owner_id = auth.uid()
    )
  );
