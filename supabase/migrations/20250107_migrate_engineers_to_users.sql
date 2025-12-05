-- Migration: Move engineers to users table
-- This preserves IDs so existing work_entries still work

-- Step 1: Insert existing engineers into users table with engineer role
INSERT INTO public.users (id, email, full_name, role, city_id, created_at, updated_at, temp_password)
SELECT
  e.id,
  LOWER(REPLACE(e.name, ' ', '')) || '@varman.local' as email,  -- Generate email from name
  e.name as full_name,
  'engineer'::user_role as role,
  NULL as city_id,  -- Admin can assign city later
  e.created_at,
  NOW() as updated_at,
  'TempPass123@' as temp_password  -- Temporary password, admin should reset
FROM engineers e
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = e.id
);

-- Add comment
COMMENT ON COLUMN public.users.temp_password IS 'Temporary password for display. For engineers migrated from old system, admin should reset password.';
