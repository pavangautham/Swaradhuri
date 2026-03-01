-- Students who signed up from invite, awaiting teacher approval
CREATE TABLE IF NOT EXISTS pending_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL,
  student_clerk_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_clerk_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_approvals_teacher ON pending_approvals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_student ON pending_approvals(student_clerk_id);

-- Allow pending_student role in users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('teacher', 'student', 'teacher_admin', 'pending_student'));
