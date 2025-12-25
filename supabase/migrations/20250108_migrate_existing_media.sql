-- Migrate existing image_url and video_url to work_entry_media table
-- This preserves all existing media while transitioning to the new schema

-- Migrate existing photos
INSERT INTO work_entry_media (work_entry_id, media_type, media_url, file_name, display_order, created_at)
SELECT
  id as work_entry_id,
  'photo' as media_type,
  image_url as media_url,
  'migrated_photo.jpg' as file_name,
  0 as display_order,
  created_at
FROM work_entries
WHERE image_url IS NOT NULL AND image_url != '';

-- Migrate existing videos
INSERT INTO work_entry_media (work_entry_id, media_type, media_url, file_name, display_order, created_at)
SELECT
  id as work_entry_id,
  'video' as media_type,
  video_url as media_url,
  'migrated_video.mp4' as file_name,
  1 as display_order,
  created_at
FROM work_entries
WHERE video_url IS NOT NULL AND video_url != '';

-- Note: Keep image_url and video_url columns for backward compatibility
-- They can be deprecated in a future migration after full rollout
