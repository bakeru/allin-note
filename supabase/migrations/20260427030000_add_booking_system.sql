CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'room' CHECK (
    type IN ('room', 'home_visit', 'external')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS location_management_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS buffer_same_location_minutes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_same_area_minutes INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS buffer_different_area_minutes INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS cancellation_deadline_hours INTEGER NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS late_cancellation_policy TEXT NOT NULL DEFAULT 'consume';

ALTER TABLE schools
DROP CONSTRAINT IF EXISTS schools_late_cancellation_policy_check;

ALTER TABLE schools
ADD CONSTRAINT schools_late_cancellation_policy_check
CHECK (late_cancellation_policy IN ('consume', 'no_cancel'));

ALTER TABLE students
ADD COLUMN IF NOT EXISTS default_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
ADD CONSTRAINT reservations_status_check
CHECK (
  status IN (
    'scheduled',
    'completed',
    'cancelled',
    'cancelled_late',
    'cancelled_by_teacher'
  )
);

CREATE INDEX IF NOT EXISTS idx_areas_school ON areas(school_id);
CREATE INDEX IF NOT EXISTS idx_locations_school ON locations(school_id);
CREATE INDEX IF NOT EXISTS idx_locations_area ON locations(area_id);
CREATE INDEX IF NOT EXISTS idx_reservations_school ON reservations(school_id);
CREATE INDEX IF NOT EXISTS idx_reservations_location ON reservations(location_id);
CREATE INDEX IF NOT EXISTS idx_reservations_teacher_time ON reservations(teacher_id, scheduled_at);

DROP TRIGGER IF EXISTS update_areas_updated_at ON areas;
CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "areas_visibility" ON areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = areas.school_id
        AND (
          schools.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM school_teachers
            WHERE school_teachers.school_id = schools.id
              AND school_teachers.teacher_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "areas_owner_manage" ON areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = areas.school_id
        AND schools.owner_id = auth.uid()
    )
  );

CREATE POLICY "locations_visibility" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = locations.school_id
        AND (
          schools.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM school_teachers
            WHERE school_teachers.school_id = schools.id
              AND school_teachers.teacher_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "locations_owner_manage" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = locations.school_id
        AND schools.owner_id = auth.uid()
    )
  );
