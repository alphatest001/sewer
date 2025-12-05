-- Enable Row Level Security (RLS) for all tables
-- This migration should be run in Supabase SQL Editor

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_city_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can insert new users
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update users
CREATE POLICY "Admins can update users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can delete non-admin users
CREATE POLICY "Admins can delete non-admin users"
ON users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  AND role != 'admin'
);

-- ============================================
-- CITIES TABLE POLICIES
-- ============================================

-- Everyone can read cities
CREATE POLICY "Everyone can read cities"
ON cities FOR SELECT
USING (true);

-- Admins can insert cities
CREATE POLICY "Admins can insert cities"
ON cities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update cities
CREATE POLICY "Admins can update cities"
ON cities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can delete cities
CREATE POLICY "Admins can delete cities"
ON cities FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- ZONES TABLE POLICIES
-- ============================================

-- Everyone can read zones
CREATE POLICY "Everyone can read zones"
ON zones FOR SELECT
USING (true);

-- Admins can insert zones
CREATE POLICY "Admins can insert zones"
ON zones FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update zones
CREATE POLICY "Admins can update zones"
ON zones FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can delete zones
CREATE POLICY "Admins can delete zones"
ON zones FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- WARDS TABLE POLICIES
-- ============================================

-- Everyone can read wards
CREATE POLICY "Everyone can read wards"
ON wards FOR SELECT
USING (true);

-- Admins can insert wards
CREATE POLICY "Admins can insert wards"
ON wards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update wards
CREATE POLICY "Admins can update wards"
ON wards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can delete wards
CREATE POLICY "Admins can delete wards"
ON wards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- LOCATIONS TABLE POLICIES
-- ============================================

-- Everyone can read locations
CREATE POLICY "Everyone can read locations"
ON locations FOR SELECT
USING (true);

-- Admins can insert locations
CREATE POLICY "Admins can insert locations"
ON locations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update locations
CREATE POLICY "Admins can update locations"
ON locations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can delete locations
CREATE POLICY "Admins can delete locations"
ON locations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- ENGINEERS TABLE POLICIES
-- ============================================

-- Everyone can read engineers
CREATE POLICY "Everyone can read engineers"
ON engineers FOR SELECT
USING (true);

-- Admins can insert engineers
CREATE POLICY "Admins can insert engineers"
ON engineers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update engineers
CREATE POLICY "Admins can update engineers"
ON engineers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can delete engineers
CREATE POLICY "Admins can delete engineers"
ON engineers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- ENGINEER_CITY_MAPPING TABLE POLICIES
-- ============================================

-- Everyone can read engineer mappings
CREATE POLICY "Everyone can read engineer mappings"
ON engineer_city_mapping FOR SELECT
USING (true);

-- Admins can insert engineer mappings
CREATE POLICY "Admins can insert engineer mappings"
ON engineer_city_mapping FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update engineer mappings
CREATE POLICY "Admins can update engineer mappings"
ON engineer_city_mapping FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can delete engineer mappings
CREATE POLICY "Admins can delete engineer mappings"
ON engineer_city_mapping FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- WORK_ENTRIES TABLE POLICIES
-- ============================================

-- Admins can read all work entries
CREATE POLICY "Admins can read all work entries"
ON work_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Employees can read work entries for their city
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

-- Customers can read work entries for their city
CREATE POLICY "Customers can read own city work entries"
ON work_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'customer'
    AND users.city_id = work_entries.city_id
  )
);

-- Admins and employees can insert work entries
CREATE POLICY "Admins and employees can insert work entries"
ON work_entries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'employee')
  )
);

-- Admins can update work entries
CREATE POLICY "Admins can update work entries"
ON work_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Only admins can delete work entries
CREATE POLICY "Only admins can delete work entries"
ON work_entries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON zones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON engineers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON engineer_city_mapping TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_entries TO authenticated;

-- ============================================
-- NOTES
-- ============================================

-- To apply this migration:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
--
-- To verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- To view all policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
