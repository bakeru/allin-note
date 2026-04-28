ALTER TABLE schools ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE locations ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE areas ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_schools_deleted_at ON schools(deleted_at);
CREATE INDEX idx_locations_deleted_at ON locations(deleted_at);
CREATE INDEX idx_areas_deleted_at ON areas(deleted_at);
CREATE INDEX idx_students_deleted_at ON students(deleted_at);
