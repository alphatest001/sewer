-- Fix RLS Circular Dependency Issue
-- This migration resolves the infinite loading issue caused by circular RLS policy checks

-- ============================================
-- CREATE SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Function to get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role::text
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Function to get current user's city_id (bypasses RLS)
CREATE OR REPLACE FUNCTION auth.user_city_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT city_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================
-- RECREATE USERS TABLE POLICIES (NO CIRCULAR DEPENDENCY)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete non-admin users" ON users;

-- Recreate with fixed logic
CREATE POLICY "Users can read own profile" 
ON users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" 
ON users 
FOR SELECT 
USING (auth.is_admin());

CREATE POLICY "Admins can insert users" 
ON users 
FOR INSERT 
WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update users" 
ON users 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Admins can delete non-admin users" 
ON users 
FOR DELETE 
USING (auth.is_admin() AND role != 'admin');

-- ============================================
-- RECREATE OTHER TABLE POLICIES (NO CIRCULAR DEPENDENCY)
-- ============================================

-- CITIES TABLE
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
DROP POLICY IF EXISTS "Admins can update cities" ON cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON cities;

CREATE POLICY "Admins can insert cities" 
ON cities 
FOR INSERT 
WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update cities" 
ON cities 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Admins can delete cities" 
ON cities 
FOR DELETE 
USING (auth.is_admin());

-- ZONES TABLE
DROP POLICY IF EXISTS "Admins can insert zones" ON zones;
DROP POLICY IF EXISTS "Admins can update zones" ON zones;
DROP POLICY IF EXISTS "Admins can delete zones" ON zones;

CREATE POLICY "Admins can insert zones" 
ON zones 
FOR INSERT 
WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update zones" 
ON zones 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Admins can delete zones" 
ON zones 
FOR DELETE 
USING (auth.is_admin());

-- WARDS TABLE
DROP POLICY IF EXISTS "Admins can insert wards" ON wards;
DROP POLICY IF EXISTS "Admins can update wards" ON wards;
DROP POLICY IF EXISTS "Admins can delete wards" ON wards;

CREATE POLICY "Admins can insert wards" 
ON wards 
FOR INSERT 
WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update wards" 
ON wards 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Admins can delete wards" 
ON wards 
FOR DELETE 
USING (auth.is_admin());

-- LOCATIONS TABLE
DROP POLICY IF EXISTS "Admins can insert locations" ON locations;
DROP POLICY IF EXISTS "Admins can update locations" ON locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON locations;

CREATE POLICY "Admins can insert locations" 
ON locations 
FOR INSERT 
WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update locations" 
ON locations 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Admins can delete locations" 
ON locations 
FOR DELETE 
USING (auth.is_admin());

-- ENGINEERS TABLE
DROP POLICY IF EXISTS "Admins can insert engineers" ON engineers;
DROP POLICY IF EXISTS "Admins can update engineers" ON engineers;
DROP POLICY IF EXISTS "Admins can delete engineers" ON engineers;

CREATE POLICY "Admins can insert engineers" 
ON engineers 
FOR INSERT 
WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update engineers" 
ON engineers 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Admins can delete engineers" 
ON engineers 
FOR DELETE 
USING (auth.is_admin());

-- ENGINEER CITY MAPPING TABLE
DROP POLICY IF EXISTS "Admins can insert engineer mappings" ON engineer_city_mapping;
DROP POLICY IF EXISTS "Admins can update engineer mappings" ON engineer_city_mapping;
DROP POLICY IF EXISTS "Admins can delete engineer mappings" ON engineer_city_mapping;

CREATE POLICY "Admins can insert engineer mappings" 
ON engineer_city_mapping 
FOR INSERT 
WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update engineer mappings" 
ON engineer_city_mapping 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Admins can delete engineer mappings" 
ON engineer_city_mapping 
FOR DELETE 
USING (auth.is_admin());

-- WORK ENTRIES TABLE
DROP POLICY IF EXISTS "Admins can read all work entries" ON work_entries;
DROP POLICY IF EXISTS "Employees can read own city work entries" ON work_entries;
DROP POLICY IF EXISTS "Customers can read own city work entries" ON work_entries;
DROP POLICY IF EXISTS "Admins and employees can insert work entries" ON work_entries;
DROP POLICY IF EXISTS "Admins can update work entries" ON work_entries;
DROP POLICY IF EXISTS "Only admins can delete work entries" ON work_entries;

CREATE POLICY "Admins can read all work entries" 
ON work_entries 
FOR SELECT 
USING (auth.is_admin());

CREATE POLICY "Employees can read own city work entries" 
ON work_entries 
FOR SELECT 
USING (
  auth.user_role() = 'employee' 
  AND auth.user_city_id() = work_entries.city_id
);

CREATE POLICY "Customers can read own city work entries" 
ON work_entries 
FOR SELECT 
USING (
  auth.user_role() = 'customer' 
  AND auth.user_city_id() = work_entries.city_id
);

CREATE POLICY "Admins and employees can insert work entries" 
ON work_entries 
FOR INSERT 
WITH CHECK (auth.user_role() IN ('admin', 'employee'));

CREATE POLICY "Admins can update work entries" 
ON work_entries 
FOR UPDATE 
USING (auth.is_admin());

CREATE POLICY "Only admins can delete work entries" 
ON work_entries 
FOR DELETE 
USING (auth.is_admin());

-- ============================================
-- GRANT EXECUTE PERMISSIONS ON HELPER FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_city_id() TO authenticated;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify the migration worked:
-- SELECT auth.is_admin() as is_admin, auth.user_role() as role, auth.user_city_id() as city_id;

