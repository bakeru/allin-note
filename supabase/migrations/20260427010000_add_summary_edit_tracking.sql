ALTER TABLE lessons
ADD COLUMN summary_for_student_original JSONB,
ADD COLUMN summary_edited_at TIMESTAMPTZ,
ADD COLUMN summary_edited_count INTEGER DEFAULT 0;
