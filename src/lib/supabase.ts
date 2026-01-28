import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -------------------- Tipos --------------------

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  rating: number;
  total_ratings: number;
  completed_tasks: number;
  published_tasks: number;
  referral_code: string | null;
  referred_by: string | null;
  successful_referrals: number;
  has_referral_discount: boolean;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  status: 'free' | 'active' | 'past_due' | 'canceled' | 'trialing';
  plan_name: string;
  discount_percentage: number;
  monthly_price: number;
  discounted_price: number;
  payment_provider: string | null;
  subscription_id_external: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  created_at: string;
  is_active: boolean;
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
  rating: number; // 1 a 5
  comment: string | null;
  created_at: string;
}


