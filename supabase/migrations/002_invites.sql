-- Pending invites (teacher invites students, admin invites teachers)
CREATE TABLE IF NOT EXISTS pending_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher')),
  inviter_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, role, inviter_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(LOWER(email));

-- Teacher-student relationship (which students belong to which teacher)
CREATE TABLE IF NOT EXISTS teacher_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL,
  student_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);

-- Allow teacher_admin role in users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('teacher', 'student', 'teacher_admin'));
