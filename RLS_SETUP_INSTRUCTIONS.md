# Row Level Security (RLS) Setup Instructions

## Overview
This document explains how to enable Row Level Security (RLS) on your Supabase database to secure your application for production.

---

## What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that allows you to restrict which rows users can access in database tables. With RLS enabled:

- **Admins** can see and modify all data
- **Employees** can only see data for their assigned city
- **Customers** can only view data for their city
- Users can only modify data they have permission to access

---

## Why Enable RLS?

Currently, RLS is **DISABLED** for development convenience. This means:
- ⚠️ Any authenticated user can read/write ALL data
- ⚠️ No row-level restrictions are enforced
- ⚠️ Not suitable for production deployment

**After enabling RLS:**
- ✅ Security policies enforce role-based access
- ✅ Data is protected at the database level
- ✅ Application is production-ready

---

## How to Enable RLS

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/djeauecionobyhdmjlnb)
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration Script

1. Open the file `supabase/migrations/20250104_enable_rls.sql`
2. Copy the **ENTIRE** contents of the file
3. Paste it into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify RLS is Enabled

Run this query to verify:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

### Step 4: View Created Policies

Run this query to see all policies:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

You should see policies like:
- "Users can read own profile"
- "Admins can read all users"
- "Employees can read own city work entries"
- etc.

---

## What the Migration Does

The migration script (`20250104_enable_rls.sql`) performs these actions:

### 1. Enables RLS on All Tables
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

### 2. Creates Security Policies

**For Users Table:**
- Users can read their own profile
- Admins can read/create/update all users
- Admins can delete non-admin users

**For Master Data (Cities, Zones, Wards, Locations, Engineers):**
- Everyone can read (needed for dropdowns)
- Only admins can create/update/delete

**For Work Entries:**
- Admins can see all entries
- Employees can see entries for their city only
- Customers can see entries for their city only
- Admins and employees can create entries
- Only admins can update/delete entries

### 3. Grants Permissions
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
-- ... etc for all tables
```

---

## Testing After RLS is Enabled

### Test 1: Admin Access
1. Login as admin (alphatestteam01@gmail.com)
2. Navigate to Work History
3. **Expected:** See all work entries from all cities

### Test 2: Employee Access (After Creating Employee User)
1. Create an employee account via Admin Panel
2. Assign them to "Surat" city
3. Login as that employee
4. Navigate to Work History
5. **Expected:** Only see work entries for Surat

### Test 3: Customer Access (After Creating Customer User)
1. Create a customer account via Admin Panel
2. Assign them to "Navsari" city
3. Login as that customer
4. Navigate to Work History
5. **Expected:** Only see work entries for Navsari (read-only)

### Test 4: Create Work Entry
1. Login as employee
2. Try to create a work entry
3. **Expected:** Success

### Test 5: Delete Protection
1. Login as employee
2. Try to delete a work entry (if button visible)
3. **Expected:** Error - only admins can delete

---

## Troubleshooting

### Issue: "Permission denied for table X"

**Cause:** RLS policies are too restrictive

**Solution:**
1. Check if you're logged in as the correct user
2. Verify the user has the correct role in the users table
3. Check if city_id is properly set for employees/customers

### Issue: "Cannot read/write data after enabling RLS"

**Cause:** User session may need refresh

**Solution:**
1. Logout and login again
2. Clear browser cache
3. Verify auth.uid() matches user's id in users table

### Issue: "Admin can't see all data"

**Cause:** User role may not be set to 'admin'

**Solution:**
```sql
SELECT id, email, role FROM users WHERE email = 'alphatestteam01@gmail.com';
```

If role is not 'admin', update it:
```sql
UPDATE users SET role = 'admin' WHERE email = 'alphatestteam01@gmail.com';
```

---

## Rollback (Disable RLS)

If you need to disable RLS for any reason:

```sql
-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE wards DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE engineers DISABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_city_mapping DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_entries DISABLE ROW LEVEL SECURITY;

-- Drop all policies (optional)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
-- ... etc
```

---

## Security Best Practices

After enabling RLS:

1. **Test Thoroughly**
   - Test all user roles (admin, employee, customer)
   - Verify data isolation works correctly
   - Check that all features still work

2. **Monitor Logs**
   - Check Supabase logs for policy violations
   - Monitor for unusual access patterns

3. **Regular Audits**
   - Periodically review policies
   - Check for unused policies
   - Update policies as requirements change

4. **User Management**
   - Always assign users to the correct city
   - Verify role assignments are correct
   - Don't create admin accounts unnecessarily

---

## Policy Reference

### Users Table Policies
- `Users can read own profile` - SELECT for own user
- `Admins can read all users` - SELECT for admins
- `Admins can insert users` - INSERT for admins
- `Admins can update users` - UPDATE for admins
- `Admins can delete non-admin users` - DELETE for admins (excludes admin role)

### Cities/Zones/Wards/Locations/Engineers Tables
- `Everyone can read X` - SELECT for all authenticated users
- `Admins can insert X` - INSERT for admins
- `Admins can update X` - UPDATE for admins
- `Admins can delete X` - DELETE for admins

### Work Entries Table
- `Admins can read all work entries` - SELECT for admins (all cities)
- `Employees can read own city work entries` - SELECT for employees (filtered by city_id)
- `Customers can read own city work entries` - SELECT for customers (filtered by city_id)
- `Admins and employees can insert work entries` - INSERT for admins and employees
- `Admins can update work entries` - UPDATE for admins
- `Only admins can delete work entries` - DELETE for admins

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Policy Examples](https://supabase.com/docs/guides/auth/row-level-security#policy-examples)

---

## Contact & Support

If you encounter any issues:
1. Check the Troubleshooting section above
2. Review Supabase logs in the Dashboard
3. Contact your database administrator

---

**Last Updated:** January 4, 2025
**Migration File:** `supabase/migrations/20250104_enable_rls.sql`
