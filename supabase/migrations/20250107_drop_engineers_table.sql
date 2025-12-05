-- Drop engineers table and related tables
-- Work entries will now reference users table directly

-- Drop engineer_city_mapping table first (has foreign key to engineers)
DROP TABLE IF EXISTS public.engineer_city_mapping CASCADE;

-- Drop engineers table
DROP TABLE IF EXISTS public.engineers CASCADE;

-- Update work_entries to reference users table
-- First, drop the old foreign key constraint
ALTER TABLE public.work_entries
DROP CONSTRAINT IF EXISTS work_entries_engineer_id_fkey;

-- Add new foreign key constraint to users table
ALTER TABLE public.work_entries
ADD CONSTRAINT work_entries_engineer_id_fkey
FOREIGN KEY (engineer_id)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.work_entries.engineer_id IS 'References users table where role is engineer or executive_engineer';
