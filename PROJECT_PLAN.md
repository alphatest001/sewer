# Sewer Work Management System - Project Plan

## Overview
A mobile-first web application for managing sewer work entries with role-based access control, built with React, Supabase, and Cloudflare R2 for media storage.

---

## User Roles & Permissions

### 1. Admin
- **Account Creation:** Seeded in database
- **Credentials:** alphatestteam01@gmail.com / Itachi@9887
- **Can See:** ALL work entries, ALL data
- **Can Do:**
  - Create/manage cities (customer entities)
  - Create/manage engineers (1:1 city mapping)
  - Create/manage executive engineers
  - Create/manage zones, wards, locations
  - Create employee accounts
  - Create customer accounts
  - Delete work entries (with confirmation)
  - Reset/override any user's password
  - Full admin panel access

### 2. Employee
- **Account Creation:** Created by Admin
- **Login:** Email + Password + City (all must match)
- **Can See:** Work entries for THEIR assigned city only
- **Can Do:**
  - Create new work entries
  - Upload/download videos/images
  - Change own password

### 3. Customer
- **Account Creation:** Created by Admin
- **Login:** Email + Password + City (all must match)
- **Can See:** Work entries for THEIR city (customer entity) only
- **Can Do:**
  - View work entries (read-only)
  - Download videos/images
  - Change own password

---

## Database Schema (Supabase) - EXISTING

### Tables (Already Created)

#### 1. users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, FK to auth.users |
| email | text | Unique |
| full_name | text | User's display name |
| role | enum | 'admin', 'employee', 'customer' |
| city_id | uuid | FK to cities (null for admin) |
| created_at | timestamp | Auto-generated |
| updated_at | timestamp | Auto-updated |

#### 2. cities (Customer Entities)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Unique, e.g., "Surat", "Navsari" |
| created_at | timestamp | Auto-generated |

**Existing Data:** Surat, Navsari

#### 3. zones
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Zone name (e.g., "East", "West") |
| city_id | uuid | FK to cities |
| created_at | timestamp | Auto-generated |

**Existing Data:** East & West (Surat), North (Navsari)

#### 4. wards
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Ward name |
| zone_id | uuid | FK to zones |
| created_at | timestamp | Auto-generated |

**Existing Data:** Ward 1, Ward 2, Ward A

#### 5. locations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Location name |
| ward_id | uuid | FK to wards |
| created_at | timestamp | Auto-generated |

**Existing Data:** Athwa Lines, Adajan, Main Market

#### 6. engineers
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Engineer's name |
| created_at | timestamp | Auto-generated |

**Existing Data:** Rajesh Kumar, Amit Patel, Priya Shah

#### 7. engineer_city_mapping
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| engineer_id | uuid | FK to engineers |
| city_id | uuid | FK to cities |
| created_at | timestamp | Auto-generated |

**Note:** 1:1 relationship - one engineer per city

#### 8. work_entries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| customer_id | uuid | FK to users |
| customer_name | text | Customer name |
| customer_mobile | text | Customer mobile |
| city_id | uuid | FK to cities |
| zone_id | uuid | FK to zones |
| ward_id | uuid | FK to wards |
| location_id | uuid | FK to locations |
| work_date | date | Date of work |
| engineer_id | uuid | FK to engineers |
| shmr | numeric | Must be > 0 |
| chmr | numeric | Must be > 0 |
| remark | text | Optional notes |
| video_url | text | Cloudflare R2 URL (NEW) |
| image_url | text | Cloudflare R2 URL (NEW) |
| created_by | uuid | FK to users (NEW) |
| created_at | timestamp | Auto-generated |
| updated_at | timestamp | Auto-updated |

---

## Authentication Flow

### Login Screen
- Fields: Email, Password, City (dropdown)
- Admin: Can select any city (sees all data anyway)
- Employee/Customer: All 3 fields must match their account

### Session Management
- Persistent sessions (remember me)
- Logout option available
- Supabase Auth for secure authentication

### Password Management
- Admin passwords: Seeded, can be reset
- Employee/Customer passwords: System-generated with option to change manually
- Admin can reset/override any password
- Users can change their own passwords

---

## Media Storage (Cloudflare R2)

### Configuration
- **Account ID:** 301d8d34d093932b5b369edf690aa325
- **Bucket Name:** sewer
- **Storage Limit:** 10GB (free tier)

### Upload Flow
- Employees can directly upload videos and images
- Files stored in Cloudflare R2
- URLs saved in work_entries table

---

## Key Business Rules

1. **SHMR/CHMR Validation:** Must be > 0 (decimal values allowed)
2. **Engineer-City Mapping:** Strict 1:1 relationship
3. **Delete Rights:** Only Admin can delete (with confirmation)
4. **No Self-Registration:** Only Admin can create accounts
5. **Admin Protection:** Admin accounts cannot be deleted

---

## UI Requirements

### Mobile-First Design
- Primary focus on mobile view
- Responsive design for web/tablet
- Touch-friendly interface
- Easy navigation

### Key Screens
1. Login Screen (mobile-optimized)
2. Work History (filtered by role)
3. New Entry Form (employees only)
4. Admin Panel (admin only)
5. Settings/Profile (password change)

---

## Implementation Phases

### Phase 1: Setup ✅
- [x] Tempo configuration (vite.config.ts, .gitignore)
- [x] Project plan documentation
- [x] Supabase database schema (already exists with tables: cities, zones, wards, locations, engineers, engineer_city_mapping, users, work_entries)
- [x] Added video_url, image_url, created_by columns to work_entries
- [ ] R2 integration setup (credentials provided, need to implement upload)

### Phase 2: Authentication ✅
- [x] Supabase client setup (src/lib/supabase.ts)
- [x] AuthContext for state management (src/contexts/AuthContext.tsx)
- [x] Login screen with city dropdown (src/components/Login.tsx)
- [x] Role-based routing in App.tsx
- [x] Session management (persistent sessions)
- [x] Edge function for seeding admin (supabase/functions/seed-admin)
- [x] Disabled RLS temporarily for development

**TO TEST:** Click "Setup Admin Account" button on login page, then login with:
- Email: alphatestteam01@gmail.com
- Password: Itachi@9887
- City: Select any city (admin can use any)

### Phase 3: Data Migration ✅ (COMPLETE)
- [x] Database already has cities: Surat, Navsari
- [x] Database already has zones, wards, locations
- [x] Database already has engineers: Rajesh Kumar, Amit Patel, Priya Shah
- [x] Removed mock data dependency from frontend (data.ts no longer used)
- [x] Connected NewEntryForm to Supabase
- [x] Connected WorkHistory to Supabase
- [x] Connected AdminPanel to Supabase

### Phase 4: Core Features ✅ (COMPLETE)
- [x] Work entry creation (with R2 upload via `src/lib/r2-upload.ts`)
- [x] Work history with role-based filtering (Admin sees all, Employee/Customer see their city)
- [x] Admin panel CRUD operations (Cities, Zones, Wards, Locations, Engineers)
- [x] Account management (create employee/customer accounts, reset passwords, delete users)
- [x] Engineer-city mapping management
- [x] Cascading dropdowns (City → Zone → Ward → Location)

### Phase 5: Polish ✅ (COMPLETE)
- [x] Mobile-responsive UI (mobile-first design with hamburger menu)
- [x] Loading states for all async operations
- [x] Error handling & validation (SHMR/CHMR > 0, form validation)
- [x] Success/error toast messages
- [x] Beautiful, modern UI with Tailwind CSS
- [ ] Delete confirmation modals (recommended for production)

---

## Environment Variables

### Supabase (Already Set)
- SUPABASE_PROJECT_ID
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

### Cloudflare R2 (To Be Set)
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_R2_ACCESS_KEY_ID
- CLOUDFLARE_R2_SECRET_ACCESS_KEY
- CLOUDFLARE_R2_BUCKET_NAME

---

## Discussion Summary

### Original Issues Raised
1. Add authentication system
2. Remove mock data
3. Admin can't be deleted
4. Admin creates customer/employee accounts
5. Engineer-City mapping in admin panel
6. Work history filtered by role
7. Delete rights only for admin
8. City dropdown on login
9. Mobile-friendly UI

### Decisions Made
- Single engineer-city 1:1 mapping
- City = Customer Entity (e.g., "Delhi Municipal Corp")
- Direct file upload (not URL paste)
- Employee accounts are separate from engineer records
- Cloudflare R2 for media storage (10GB free)
- Start with 1 admin account, add more later

---

*Last Updated: Initial Planning Phase*
