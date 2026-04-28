ALTER TABLE students DROP CONSTRAINT IF EXISTS students_teacher_id_fkey;
ALTER TABLE students
ADD CONSTRAINT students_teacher_id_fkey
FOREIGN KEY (teacher_id) REFERENCES profiles(id);

ALTER TABLE student_invitations DROP CONSTRAINT IF EXISTS student_invitations_teacher_id_fkey;
ALTER TABLE student_invitations
ADD CONSTRAINT student_invitations_teacher_id_fkey
FOREIGN KEY (teacher_id) REFERENCES profiles(id);

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_teacher_id_fkey;
ALTER TABLE lessons
ADD CONSTRAINT lessons_teacher_id_fkey
FOREIGN KEY (teacher_id) REFERENCES profiles(id);

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_teacher_id_fkey;
ALTER TABLE reservations
ADD CONSTRAINT reservations_teacher_id_fkey
FOREIGN KEY (teacher_id) REFERENCES profiles(id);

DROP TABLE IF EXISTS teachers CASCADE;
