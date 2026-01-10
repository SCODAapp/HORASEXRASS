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
  rating: number;
  total_ratings: number;
  completed_tasks: number;
  published_tasks: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: 'available' | 'assigned' | 'in_progress' | 'completed' | 'rated';
  assigned_to: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  is_rated: boolean;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  assignee?: Profile;
};

export type TaskRating = {
  id: string;
  task_id: string;
  rated_user_id: string;
  rating_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
