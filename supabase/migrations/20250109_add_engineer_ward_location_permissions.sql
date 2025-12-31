-- Migration: Add Ward and Location Creation Permissions for Engineers and Executive Engineers
-- Date: 2025-01-09
-- Description: Enable engineers and executive engineers to create wards and locations
--              within their assigned city while maintaining admin-only update/delete permissions

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user's city matches target city
CREATE OR REPLACE FUNCTION user_can_access_city(user_city_id UUID, target_city_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_city_id = target_city_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get city_id from zone_id
CREATE OR REPLACE FUNCTION get_city_from_zone(target_zone_id UUID)
RETURNS UUID AS $$
DECLARE
  city_id UUID;
BEGIN
  SELECT zones.city_id INTO city_id
  FROM zones
  WHERE zones.id = target_zone_id;

  RETURN city_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get city_id from ward_id (traverses ward -> zone -> city)
CREATE OR REPLACE FUNCTION get_city_from_ward(target_ward_id UUID)
RETURNS UUID AS $$
DECLARE
  city_id UUID;
BEGIN
  SELECT zones.city_id INTO city_id
  FROM wards
  JOIN zones ON zones.id = wards.zone_id
  WHERE wards.id = target_ward_id;

  RETURN city_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE WARDS TABLE POLICIES
-- ============================================

-- Drop old admin-only INSERT policy
DROP POLICY IF EXISTS "Admins can insert wards" ON wards;

-- Create new policy allowing engineers/exec_engineers
CREATE POLICY "Admins and engineers can insert wards"
ON wards FOR INSERT
WITH CHECK (
  -- Admin can insert anywhere
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  -- Engineer/Exec Engineer can insert if zone's city matches their city
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('engineer', 'executive_engineer')
    AND users.city_id IS NOT NULL
    AND user_can_access_city(users.city_id, get_city_from_zone(zone_id))
  )
);

-- ============================================
-- UPDATE LOCATIONS TABLE POLICIES
-- ============================================

-- Drop old admin-only INSERT policy
DROP POLICY IF EXISTS "Admins can insert locations" ON locations;

-- Create new policy allowing engineers/exec_engineers
CREATE POLICY "Admins and engineers can insert locations"
ON locations FOR INSERT
WITH CHECK (
  -- Admin can insert anywhere
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  -- Engineer/Exec Engineer can insert if ward's city matches their city
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('engineer', 'executive_engineer')
    AND users.city_id IS NOT NULL
    AND user_can_access_city(users.city_id, get_city_from_ward(ward_id))
  )
);

-- ============================================
-- NOTES
-- ============================================

-- UPDATE and DELETE policies remain admin-only (no changes needed)
-- This migration only affects INSERT operations for wards and locations
-- Engineers and executive engineers can now create wards/locations in their assigned city
-- All other operations remain restricted to admin users only
