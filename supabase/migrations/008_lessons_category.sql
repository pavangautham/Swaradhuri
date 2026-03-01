-- Add optional category to lessons (set when sent from library; students can filter by category)
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(student_id, category);
