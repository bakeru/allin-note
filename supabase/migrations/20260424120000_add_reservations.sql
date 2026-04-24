CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'completed', 'cancelled')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_teacher_date
  ON reservations(teacher_id, scheduled_at);

CREATE INDEX idx_reservations_student
  ON reservations(student_id);

ALTER TABLE lessons
  ADD COLUMN reservation_id UUID REFERENCES reservations(id);

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_own_reservations" ON reservations
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "student_view_own_reservations" ON reservations
  FOR SELECT USING (auth.uid() = student_id);
