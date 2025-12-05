import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type UserRole = 'admin' | 'employee' | 'customer' | 'engineer' | 'executive_engineer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  city_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  city_id: string;
  created_at: string;
}

export interface Ward {
  id: string;
  name: string;
  zone_id: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  ward_id: string;
  created_at: string;
}

export interface Engineer {
  id: string;
  name: string;
  created_at: string;
}

export interface EngineerCityMapping {
  id: string;
  engineer_id: string;
  city_id: string;
  created_at: string;
}

export interface WorkEntry {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  city_id: string;
  zone_id: string;
  ward_id: string;
  location_id: string;
  work_date: string;
  engineer_id: string;
  shmr: number;
  chmr: number;
  remark: string | null;
  video_url: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
