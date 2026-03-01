-- Track students that a teacher has removed (left the class)
-- Used to exclude them from the student list
CREATE TABLE IF NOT EXISTS teacher_removed_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL,
  student_id text NOT NULL,
  removed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_removed_students_teacher ON teacher_removed_students(teacher_id);
