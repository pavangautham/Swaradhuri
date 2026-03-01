-- Support multiple lyrics images (e.g. multi-page book scans)
-- Add lyrics_image_paths as JSONB array; migrate from single lyrics_image_path if present; drop old column
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lyrics_image_paths jsonb DEFAULT '[]';

-- Migrate existing single lyrics_image_path into array (if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'lyrics_image_path') THEN
    UPDATE lessons SET lyrics_image_paths = jsonb_build_array(lyrics_image_path) WHERE lyrics_image_path IS NOT NULL AND lyrics_image_path != '';
    ALTER TABLE lessons DROP COLUMN lyrics_image_path;
  END IF;
END $$;
