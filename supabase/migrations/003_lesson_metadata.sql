-- Add optional title, raaga, thala to lessons
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS raaga text,
  ADD COLUMN IF NOT EXISTS thala text;
