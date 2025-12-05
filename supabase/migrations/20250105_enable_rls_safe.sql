-- Safe RLS Migration - Only creates what doesn't exist
-- This can be run multiple times safely

-- ============================================
-- ENABLE RLS ON ALL TABLES (Safe to rerun)
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
-- DROP EXISTING POLICIES (to recreate them)
-- ============================================

-- Users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete non-admin users" ON users;

-- Cities table
DROP POLICY IF EXISTS "Everyone can read cities" ON cities;
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
DROP POLICY IF EXISTS "Admins can update cities" ON cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON cities;

-- Zones table
DROP POLICY IF EXISTS "Everyone can read zones" ON zones;
DROP POLICY IF EXISTS "Admins can insert zones" ON zones;
DROP POLICY IF EXISTS "Admins can update zones" ON zones;
DROP POLICY IF EXISTS "Admins can delete zones" ON zones;

-- Wards table
DROP POLICY IF EXISTS "Everyone can read wards" ON wards;
DROP POLICY IF EXISTS "Admins can insert wards" ON wards;
DROP POLICY IF EXISTS "Admins can update wards" ON wards;
DROP POLICY IF EXISTS "Admins can delete wards" ON wards;

-- Locations table
DROP POLICY IF EXISTS "Everyone can read locations" ON locations;
DROP POLICY IF EXISTS "Admins can insert locations" ON locations;
DROP POLICY IF EXISTS "Admins can update locations" ON locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON locations;

-- Engineers table
DROP POLICY IF EXISTS "Everyone can read engineers" ON engineers;
DROP POLICY IF EXISTS "Admins can insert engineers" ON engineers;
DROP POLICY IF EXISTS "Admins can update engineers" ON engineers;
DROP POLICY IF EXISTS "Admins can delete engineers" ON engineers;

-- Engineer mapping table
DROP POLICY IF EXISTS "Everyone can read engineer mappings" ON engineer_city_mapping;
DROP POLICY IF EXISTS "Admins can insert engineer mappings" ON engineer_city_mapping;
DROP POLICY IF EXISTS "Admins can update engineer mappings" ON engineer_city_mapping;
DROP POLICY IF EXISTS "Admins can delete engineer mappings" ON engineer_city_mapping;

-- Work entries table
DROP POLICY IF EXISTS "Admins can read all work entries" ON work_entries;
DROP POLICY IF EXISTS "Employees can read own city work entries" ON work_entries;
DROP POLICY IF EXISTS "Customers can read own city work entries" ON work_entries;
DROP POLICY IF EXISTS "Admins and employees can insert work entries" ON work_entries;
DROP POLICY IF EXISTS "Admins can update work entries" ON work_entries;
DROP POLICY IF EXISTS "Only admins can delete work entries" ON work_entries;

-- ============================================
-- CREATE ALL POLICIES
-- ============================================

-- USERS TABLE
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete non-admin users" ON users FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin') AND role != 'admin');

-- CITIES TABLE
CREATE POLICY "Everyone can read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Admins can insert cities" ON cities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update cities" ON cities FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete cities" ON cities FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ZONES TABLE
CREATE POLICY "Everyone can read zones" ON zones FOR SELECT USING (true);
CREATE POLICY "Admins can insert zones" ON zones FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update zones" ON zones FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete zones" ON zones FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- WARDS TABLE
CREATE POLICY "Everyone can read wards" ON wards FOR SELECT USING (true);
CREATE POLICY "Admins can insert wards" ON wards FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update wards" ON wards FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete wards" ON wards FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- LOCATIONS TABLE
CREATE POLICY "Everyone can read locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Admins can insert locations" ON locations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update locations" ON locations FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete locations" ON locations FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ENGINEERS TABLE
CREATE POLICY "Everyone can read engineers" ON engineers FOR SELECT USING (true);
CREATE POLICY "Admins can insert engineers" ON engineers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update engineers" ON engineers FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete engineers" ON engineers FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ENGINEER CITY MAPPING TABLE
CREATE POLICY "Everyone can read engineer mappings" ON engineer_city_mapping FOR SELECT USING (true);
CREATE POLICY "Admins can insert engineer mappings" ON engineer_city_mapping FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update engineer mappings" ON engineer_city_mapping FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete engineer mappings" ON engineer_city_mapping FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- WORK ENTRIES TABLE
CREATE POLICY "Admins can read all work entries" ON work_entries FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Employees can read own city work entries" ON work_entries FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'employee' AND users.city_id = work_entries.city_id));
CREATE POLICY "Customers can read own city work entries" ON work_entries FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'customer' AND users.city_id = work_entries.city_id));
CREATE POLICY "Admins and employees can insert work entries" ON work_entries FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'employee')));
CREATE POLICY "Admins can update work entries" ON work_entries FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Only admins can delete work entries" ON work_entries FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
