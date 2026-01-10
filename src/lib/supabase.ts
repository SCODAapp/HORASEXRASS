import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'employee' | 'employer';
  phone?: string;
  created_at: string;
  updated_at: string;
};

export type OvertimeRequest = {
  id: string;
  employee_id: string;
  date: string;
  hours: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  created_at: string;
  updated_at: string;
};

export type OvertimeWithProfile = OvertimeRequest & {
  profiles: Profile;
};
