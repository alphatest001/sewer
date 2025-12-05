-- Prepare for migration by creating a mapping table
-- This will help us update work_entries references after migration

CREATE TABLE IF NOT EXISTS engineer_migration_mapping (
  old_engineer_id UUID PRIMARY KEY,
  new_user_id UUID,
  engineer_name TEXT,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE engineer_migration_mapping IS 'Temporary table to track engineer to user migration';
