-- Add temp_password column to users table for storing auto-generated passwords
-- This is only for display in admin panel, NOT for authentication
ALTER TABLE public.users
ADD COLUMN temp_password TEXT;

COMMENT ON COLUMN public.users.temp_password IS 'Temporary password shown to admin for user login. For display only, not used for authentication.';
