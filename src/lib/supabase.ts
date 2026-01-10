import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  rating_average: number;
  rating_count: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  employer?: Profile;
  worker?: Profile;
};

export type TaskApplication = {
  id: string;
  task_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
  worker?: Profile;
};

export type Rating = {
  id: string;
  task_id: string;
  worker_id: string;
  employer_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
};
