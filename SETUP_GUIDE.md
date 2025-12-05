# Setup Guide - VARMAN Equipment Services

This guide will help you set up and run the Sewer Work Management System.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (already configured)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Step-by-Step Setup

### 1. Install Dependencies

The dependencies are already installed. If you need to reinstall them:

```bash
npm install
```

### 2. Configure Environment Variables

**IMPORTANT:** Create a `.env` file in the project root with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://djeauecionobyhdmjlnb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNTI5NjIsImV4cCI6MjA2NDYyODk2Mn0.pu3S0ELfN59Hp2wTcHYVHQb7oZjkdZP3LOQfZF0RjBg

# Cloudflare R2 (for media uploads)
VITE_CLOUDFLARE_ACCOUNT_ID=301d8d34d093932b5b369edf690aa325
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=1618f8c6de6ddc7c6896297cca71d00e
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=46a3b1ffc2ac913c50d0e01abf86c2e0878049f0948e042976927542bca304a2
VITE_CLOUDFLARE_R2_BUCKET_NAME=sewer
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://pub-ce85aff3dd904ca7be2a77a0c08e88e5.r2.dev
```

### 3. Setup Admin Account (First Time Only)

Before you can log in, you need to create the admin account:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. On the login page, click the **"Setup Admin Account (First Time Only)"** button

4. Wait for the success message

### 4. Login

Use the following credentials to log in:

- **Email:** `alphatestteam01@gmail.com`
- **Password:** `Itachi@9887`
- **City:** Select any city (admin can access all cities)

## User Roles & Permissions

### Admin
- **Can See:** All work entries from all cities
- **Can Do:**
  - Create/delete work entries
  - Manage master data (cities, zones, wards, locations, engineers)
  - Create employee and customer accounts
  - Delete non-admin users
  - Full admin panel access

### Employee
- **Can See:** Work entries for their assigned city only
- **Can Do:**
  - Create new work entries
  - Upload photos and videos
  - View work history for their city

### Customer
- **Can See:** Work entries for their city only
- **Can Do:**
  - View work entries (read-only)
  - Download media files

## Features Implemented

### ✅ Phase 1: Setup
- [x] Vite + React + TypeScript project
- [x] Tailwind CSS styling
- [x] Supabase database schema
- [x] Project documentation

### ✅ Phase 2: Authentication
- [x] Supabase Auth integration
- [x] Login screen with email, password, city dropdown
- [x] Role-based navigation (Admin/Employee/Customer)
- [x] Persistent sessions (remember me)
- [x] Logout functionality
- [x] Admin seeding edge function

### ✅ Phase 3: Data Migration
- [x] Connected NewEntryForm to Supabase
- [x] Connected WorkHistory to Supabase
- [x] Connected AdminPanel to Supabase
- [x] Removed mock data dependencies

### ✅ Phase 4: Core Features
- [x] Work entry creation with media upload
- [x] Work history with role-based filtering
- [x] Admin panel CRUD operations
- [x] Account management (create employee/customer accounts)

## Database Schema

The application uses the following Supabase tables:

- **users** - User accounts (admin, employee, customer)
- **cities** - Customer entities (e.g., Surat, Navsari)
- **zones** - Zones within cities
- **wards** - Wards within zones
- **locations** - Locations within wards
- **engineers** - Engineer records
- **engineer_city_mapping** - 1:1 engineer-city relationship
- **work_entries** - Work entry records with media URLs

## Testing the Application

### Test Admin Functions

1. **Login as Admin**
   - Use credentials above
   - Verify you can see all menu items

2. **Manage Master Data**
   - Go to Admin Panel
   - Try adding/deleting cities, zones, wards, locations, engineers
   - Verify cascading deletes work correctly

3. **Create User Accounts**
   - Go to Admin Panel > User Accounts tab
   - Create an employee account with a city
   - Create a customer account with a city
   - Verify accounts appear in the list

4. **Create Work Entry**
   - Go to New Entry
   - Fill in all required fields
   - Upload a photo (optional)
   - Upload a video (optional)
   - Submit and verify it appears in Work History

5. **Delete Work Entry**
   - Go to Work History
   - Click the delete button on an entry
   - Confirm deletion
   - Verify entry is removed

### Test Employee Functions

1. **Login as Employee**
   - Use the employee account you created
   - Select the correct city
   - Verify you only see New Entry and Work History

2. **Create Work Entry**
   - Fill in customer details
   - Select location hierarchy
   - Enter SHMR and CHMR values
   - Upload media
   - Submit

3. **View Work History**
   - Verify you only see entries for your city
   - Try filtering by date and customer name
   - Click on an entry to view details

### Test Customer Functions

1. **Login as Customer**
   - Use the customer account you created
   - Select the correct city
   - Verify you only see Work History (read-only)

2. **View Work History**
   - Verify you only see entries for your city
   - Verify you cannot delete entries
   - Click on an entry to view details and download media

## Troubleshooting

### Cities not loading in dropdown
1. Check if `.env` file exists and has correct Supabase credentials
2. Click the "Refresh" button next to the city dropdown
3. Check browser console for errors

### Admin account not created
1. Click "Setup Admin Account (First Time Only)" on login page
2. Check Supabase dashboard > Authentication > Users
3. Check Supabase dashboard > Table Editor > users

### Login fails
1. Ensure you clicked "Setup Admin Account" first
2. Verify credentials: `alphatestteam01@gmail.com` / `Itachi@9887`
3. Select any city from dropdown

### Cannot create user accounts
1. Verify you're logged in as admin
2. Check that the city is selected
3. Ensure password is at least 6 characters
4. Check browser console for errors

### Work entries not showing
1. Verify you have created at least one work entry
2. Check that the user's city matches the entry's city (for non-admin users)
3. Try clearing filters in Work History
4. Check browser console for errors

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npm run typecheck
```

## Important Notes

1. **SHMR/CHMR Validation:** Both values must be greater than 0
2. **Engineer-City Mapping:** One engineer can be assigned to one city (1:1 relationship)
3. **Delete Rights:** Only Admin can delete entries (with confirmation)
4. **Admin Protection:** Admin accounts cannot be deleted
5. **Media Upload:** Currently uses data URLs for demo purposes. For production, implement actual Cloudflare R2 upload via Edge Functions

## Next Steps (Future Enhancements)

- [ ] Implement actual Cloudflare R2 upload via Supabase Edge Functions
- [ ] Add password reset functionality
- [ ] Add user profile editing
- [ ] Add export functionality (PDF/Excel reports)
- [ ] Add advanced filtering and search
- [ ] Add data visualization (charts, graphs)
- [ ] Implement mobile app using React Native
- [ ] Add email notifications
- [ ] Add audit logs

## Support

For issues or questions, please check:
- Supabase Dashboard: https://supabase.com/dashboard/project/djeauecionobyhdmjlnb
- README.md for project overview
- PROJECT_PLAN.md for detailed specifications

---

**Last Updated:** December 2024



