# VARMAN Equipment Services - Sewer Work Management System

A mobile-first web application for managing sewer work entries with role-based access control.

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Media Storage:** Cloudflare R2 (10GB free)
- **Icons:** Lucide React

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (already configured)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd <project-folder>
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://djeauecionobyhdmjlnb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNTI5NjIsImV4cCI6MjA2NDYyODk2Mn0.YOUR_ANON_KEY

# Cloudflare R2 (for media uploads - to be implemented)
CLOUDFLARE_ACCOUNT_ID=301d8d34d093932b5b369edf690aa325
CLOUDFLARE_R2_ACCESS_KEY_ID=1618f8c6de6ddc7c6896297cca71d00e
CLOUDFLARE_R2_SECRET_ACCESS_KEY=46a3b1ffc2ac913c50d0e01abf86c2e0878049f0948e042976927542bca304a2
CLOUDFLARE_R2_BUCKET_NAME=sewer
```

> ⚠️ **Note:** Get the actual Supabase keys from your Supabase project dashboard: https://supabase.com/dashboard/project/djeauecionobyhdmjlnb/settings/api

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔐 Login Credentials

### Admin Account
- **Email:** `alphatestteam01@gmail.com`
- **Password:** `Itachi@9887`
- **City:** Select any city (admin can access all)

### First Time Setup
1. Open the app
2. Click **"Setup Admin Account (First Time Only)"** button on login page
3. This creates the admin user in the database
4. Login with the credentials above

---

## 👥 User Roles

| Role | Can See | Can Do |
|------|---------|--------|
| **Admin** | All data | Create/delete entries, manage users, full admin panel |
| **Employee** | Work entries for their city | Create entries, upload media |
| **Customer** | Work entries for their city | View only, download media |

---

## 📁 Project Structure

```
├── src/
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   ├── types.ts                # TypeScript types
│   ├── data.ts                 # Mock data (to be removed)
│   ├── components/
│   │   ├── Login.tsx           # Login screen with city dropdown
│   │   ├── NewEntryForm.tsx    # Work entry form
│   │   ├── WorkHistory.tsx     # Work entries list
│   │   ├── AdminPanel.tsx      # Admin management panel
│   │   ├── EntryDetailModal.tsx
│   │   ├── NumericInput.tsx
│   │   └── Toast.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   └── lib/
│       └── supabase.ts         # Supabase client & types
├── supabase/
│   └── functions/
│       └── seed-admin/         # Edge function to create admin
│           └── index.ts
├── PROJECT_PLAN.md             # Detailed project plan
└── README.md                   # This file
```

---

## 🗄️ Database Schema (Supabase)

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts (admin, employee, customer) |
| `cities` | Customer entities (Surat, Navsari) |
| `zones` | Zones within cities |
| `wards` | Wards within zones |
| `locations` | Locations within wards |
| `engineers` | Engineer records |
| `engineer_city_mapping` | 1:1 engineer-city relationship |
| `work_entries` | Work entry records |

### Existing Data
- **Cities:** Surat, Navsari
- **Zones:** East, West (Surat), North (Navsari)
- **Wards:** Ward 1, Ward 2, Ward A
- **Locations:** Athwa Lines, Adajan, Main Market
- **Engineers:** Rajesh Kumar, Amit Patel, Priya Shah

---

## ✅ Completed Features

### Phase 1: Setup ✅
- [x] Vite + React + TypeScript project
- [x] Tailwind CSS styling
- [x] Supabase database schema
- [x] Project documentation

### Phase 2: Authentication ✅
- [x] Supabase Auth integration
- [x] Login screen with email, password, city dropdown
- [x] Role-based navigation (Admin/Employee/Customer)
- [x] Persistent sessions (remember me)
- [x] Logout functionality
- [x] Admin seeding edge function

### Phase 3: Data Migration ✅
- [x] Removed mock data dependency from `data.ts`
- [x] Connected NewEntryForm to Supabase
- [x] Connected WorkHistory to Supabase
- [x] Connected AdminPanel to Supabase
- [x] All dropdowns fetch live data from database

### Phase 4: Core Features ✅
- [x] Work entry creation with Cloudflare R2 upload
- [x] Work history with role-based filtering
- [x] Admin panel CRUD operations (Cities, Zones, Wards, Locations, Engineers)
- [x] User management (create employee/customer accounts, reset passwords, delete users)
- [x] Engineer-city mapping management
- [x] Cascading dropdowns (City → Zone → Ward → Location)
- [x] Media upload integration (Cloudflare R2)

### Phase 5: Polish ✅
- [x] Mobile-responsive UI (mobile-first design)
- [x] Error handling & validation
- [x] Loading states for all async operations
- [x] Success/error toast messages
- [x] Form validation (SHMR/CHMR > 0)
- [x] Beautiful, modern UI with Tailwind CSS

---

## 🔜 Future Enhancements (Optional)

### Security & Production
- [ ] Enable Row Level Security (RLS) policies
- [ ] Configure email sending for password resets
- [ ] Add delete confirmation modals

### Features
- [ ] Export work history (CSV/PDF)
- [ ] Dashboard with analytics/charts
- [ ] Audit logs
- [ ] Advanced search & filters
- [ ] Notifications (email/SMS)

---

## 🔧 Cloudflare R2 Configuration

Media storage is configured but not yet implemented.

| Setting | Value |
|---------|-------|
| Account ID | `301d8d34d093932b5b369edf690aa325` |
| Bucket Name | `sewer` |
| Access Key ID | `1618f8c6de6ddc7c6896297cca71d00e` |
| Storage Limit | 10GB (free tier) |

---

## 📋 Business Rules

1. **SHMR/CHMR:** Must be > 0 (decimal values allowed)
2. **Engineer-City:** Strict 1:1 relationship
3. **Delete Rights:** Only Admin can delete (with confirmation)
4. **Account Creation:** Only Admin can create accounts
5. **Admin Protection:** Admin accounts cannot be deleted

---

## 🔗 Important Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/djeauecionobyhdmjlnb
- **Cloudflare R2:** https://dash.cloudflare.com (Account: 301d8d34d093932b5b369edf690aa325)

---

## 📝 Development Notes

### Authentication Flow
1. User enters email, password, and selects city
2. Admin can select any city (sees all data)
3. Employee/Customer must select their assigned city
4. Session persists across browser sessions

### Key Files to Modify
- `src/data.ts` - Contains mock data (to be replaced with Supabase queries)
- `src/components/NewEntryForm.tsx` - Add Supabase integration
- `src/components/WorkHistory.tsx` - Add Supabase queries with role filtering
- `src/components/AdminPanel.tsx` - Add CRUD operations

---

## 🐛 Troubleshooting

### Cities not loading in dropdown
1. Check if Supabase URL and Anon Key are correct in `.env`
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

---

## 📄 License

Private - VARMAN Equipment Services

---

*Last Updated: January 2025*
