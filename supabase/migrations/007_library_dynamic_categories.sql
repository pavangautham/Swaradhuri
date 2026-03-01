-- Lesson library (repertoire) for teachers. Category is teacher-defined (e.g. Varnas, Krithis, etc.).
CREATE TABLE IF NOT EXISTS lesson_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL,
  category text NOT NULL,
  title text,
  raaga text,
  thala text,
  lyrics text NOT NULL,
  audio_path text NOT NULL DEFAULT '',
  lyrics_image_paths jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_library_teacher_id ON lesson_library(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_library_category ON lesson_library(teacher_id, category);
CREATE INDEX IF NOT EXISTS idx_lesson_library_created_at ON lesson_library(created_at DESC);
