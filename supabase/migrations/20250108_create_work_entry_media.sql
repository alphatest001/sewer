-- Create work_entry_media table for storing multiple photos and videos per work entry
CREATE TABLE IF NOT EXISTS work_entry_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_entry_id UUID NOT NULL REFERENCES work_entries(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_work_entry_media_work_entry_id ON work_entry_media(work_entry_id);
CREATE INDEX idx_work_entry_media_type ON work_entry_media(media_type);
CREATE INDEX idx_work_entry_media_display_order ON work_entry_media(work_entry_id, display_order);

-- Enable RLS
ALTER TABLE work_entry_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies (matching work_entries patterns)

-- Admins can read all media
CREATE POLICY "Admins can read all media"
  ON work_entry_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Engineers can read own city media
CREATE POLICY "Engineers can read own city media"
  ON work_entry_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    JOIN work_entries we ON we.id = work_entry_media.work_entry_id
    WHERE u.id = auth.uid()
      AND u.role IN ('engineer', 'executive_engineer')
      AND u.city_id = we.city_id
  ));

-- Customers can read own city media
CREATE POLICY "Customers can read own city media"
  ON work_entry_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    JOIN work_entries we ON we.id = work_entry_media.work_entry_id
    WHERE u.id = auth.uid()
      AND u.role = 'customer'
      AND u.city_id = we.city_id
  ));

-- Admins and engineers can insert media
CREATE POLICY "Admins and engineers can insert media"
  ON work_entry_media FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'engineer', 'executive_engineer')
  ));

-- Admins can update media
CREATE POLICY "Admins can update media"
  ON work_entry_media FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Admins can delete media
CREATE POLICY "Admins can delete media"
  ON work_entry_media FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_work_entry_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_entry_media_updated_at
  BEFORE UPDATE ON work_entry_media
  FOR EACH ROW
  EXECUTE FUNCTION update_work_entry_media_updated_at();
