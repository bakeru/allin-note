CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'expired', 'cancelled')
  ),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id),
  teacher_role TEXT CHECK (
    teacher_role IS NULL OR teacher_role IN ('owner', 'head_teacher', 'teacher')
  ),
  student_name TEXT,
  student_teacher_id UUID REFERENCES profiles(id),
  default_location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_school ON invitations(school_id);
CREATE INDEX idx_invitations_status ON invitations(status);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_owner_visibility" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE id = invitations.school_id
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "invitations_owner_modify" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE id = invitations.school_id
        AND owner_id = auth.uid()
    )
  );
