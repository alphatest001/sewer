-- Migration: Rename 'engineer' role to 'supervisor' and remove 'executive_engineer' role
-- Date: 2025-01-21
-- Description: 
--   1. Delete all users with role='executive_engineer'
--   2. Drop executive_engineer_id column from work_entries table
--   3. Rename 'engineer' role to 'supervisor'
--   5. Rename engineer_id column to supervisor_id in work_entries table
--   6. Update all RLS policies to use 'supervisor' instead of 'engineer' or 'executive_engineer'

-- ============================================
-- STEP 1: Delete all executive_engineer users
-- ============================================
DELETE FROM users WHERE role = 'executive_engineer';

-- ============================================
-- STEP 2: Drop executive_engineer_id column from work_entries
-- ============================================
ALTER TABLE work_entries DROP COLUMN IF EXISTS executive_engineer_id CASCADE;

-- ============================================
-- STEP 3: Update all users from 'engineer' to 'supervisor'
-- ============================================
UPDATE users SET role = 'supervisor' WHERE role = 'engineer';

-- ============================================
-- STEP 4: Create new enum type with correct values
-- ============================================
-- PostgreSQL doesn't support renaming enum values, so we need to:
-- 1. Create a new enum type
-- 2. Alter the column to use the new type
-- 3. Drop the old enum
-- 4. Rename the new enum to the old name

CREATE TYPE user_role_new AS ENUM ('admin', 'employee', 'customer', 'supervisor');

-- Alter the column to use the new enum type
ALTER TABLE users 
  ALTER COLUMN role TYPE user_role_new 
  USING role::text::user_role_new;

-- Drop the old enum type
DROP TYPE user_role;

-- Rename the new enum to the original name
ALTER TYPE user_role_new RENAME TO user_role;

-- ============================================
-- STEP 5: Rename engineer_id column to supervisor_id
-- ============================================

-- Drop the old foreign key constraint
ALTER TABLE work_entries 
DROP CONSTRAINT IF EXISTS work_entries_engineer_id_fkey;

-- Rename the column
ALTER TABLE work_entries 
RENAME COLUMN engineer_id TO supervisor_id;

-- Re-create the foreign key constraint with new name
ALTER TABLE work_entries
ADD CONSTRAINT work_entries_supervisor_id_fkey
FOREIGN KEY (supervisor_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- Update the comment
COMMENT ON COLUMN public.work_entries.supervisor_id IS 'References users table where role is supervisor';

-- ============================================
-- STEP 6: Update RLS Policies for work_entries
-- ============================================

-- Drop old policies that reference 'engineer' or 'executive_engineer'
DROP POLICY IF EXISTS "Employees can read own city work entries" ON work_entries;
DROP POLICY IF EXISTS "Admins and employees can insert work entries" ON work_entries;

-- Recreate policies with 'supervisor' role
CREATE POLICY "Employees can read own city work entries"
ON work_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'employee'
    AND users.city_id = work_entries.city_id
  )
);

CREATE POLICY "Supervisors can read own city work entries"
ON work_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'supervisor'
    AND users.city_id = work_entries.city_id
  )
);

CREATE POLICY "Admins employees and supervisors can insert work entries"
ON work_entries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'employee', 'supervisor')
  )
);

-- ============================================
-- STEP 7: Update RLS Policies for work_entry_media
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Engineers and executive engineers can read media for their city" ON work_entry_media;
DROP POLICY IF EXISTS "Admins engineers and executive engineers can insert media" ON work_entry_media;

-- Recreate with supervisor role
CREATE POLICY "Supervisors can read media for their city"
ON work_entry_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM work_entries we
    JOIN users u ON u.id = auth.uid()
    WHERE we.id = work_entry_media.work_entry_id
      AND u.city_id = we.city_id
      AND u.role = 'supervisor'
  )
);

CREATE POLICY "Admins and supervisors can insert media"
ON work_entry_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'supervisor')
  )
);

-- ============================================
-- STEP 8: Update RLS Policies for wards
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Engineers can insert wards in their city" ON wards;

-- Recreate with supervisor role
CREATE POLICY "Supervisors can insert wards in their city"
ON wards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN zones ON zones.city_id = users.city_id
    WHERE users.id = auth.uid()
    AND users.role = 'supervisor'
    AND zones.id = wards.zone_id
  )
);

-- ============================================
-- STEP 9: Update RLS Policies for locations
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Engineers can insert locations in their city" ON locations;

-- Recreate with supervisor role
CREATE POLICY "Supervisors can insert locations in their city"
ON locations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN zones ON zones.city_id = users.city_id
    JOIN wards ON wards.zone_id = zones.id
    WHERE users.id = auth.uid()
    AND users.role = 'supervisor'
    AND wards.id = locations.ward_id
  )
);

-- ============================================
-- NOTES
-- ============================================
-- This migration:
-- 1. Permanently deletes all users with executive_engineer role
-- 2. Permanently removes executive_engineer_id column and all its data
-- 3. Renames all 'engineer' roles to 'supervisor'
-- 4. Renames engineer_id column to supervisor_id in work_entries
-- 5. Updates all RLS policies to reflect the new role name
-- 
-- WARNING: This operation cannot be rolled back without data loss
