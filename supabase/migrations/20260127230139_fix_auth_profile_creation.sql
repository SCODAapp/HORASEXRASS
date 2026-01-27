/*
  # Fix Authentication and Profile Creation

  ## Problem
  - Users cannot register because there's no automatic profile creation
  - Frontend tries to create profile manually but timing/RLS issues prevent it
  - Missing trigger to auto-create profile on auth.users insert

  ## Solution
  1. Create trigger function to automatically create profile when user signs up
  2. Ensure proper RLS policies for profile insertion
  3. Auto-generate referral code for new users

  ## Changes
  - Add trigger function `handle_new_user()` to create profile automatically
  - Trigger runs when new user is inserted in auth.users
  - Generates unique referral code from user's name
  - Ensures profile creation happens with SECURITY DEFINER (bypasses RLS)
*/

-- Function to generate referral code from name
CREATE OR REPLACE FUNCTION generate_referral_code(user_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract first word of name and convert to uppercase
  base_code := UPPER(REGEXP_REPLACE(SPLIT_PART(user_name, ' ', 1), '[^a-zA-Z]', '', 'g'));
  
  -- Limit to 10 characters and add last 4 chars of UUID
  base_code := SUBSTRING(base_code, 1, 10) || SUBSTRING(REPLACE(user_id::TEXT, '-', ''), 1, 4);
  
  final_code := base_code;
  
  -- Ensure uniqueness by adding counter if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_ref_code TEXT;
BEGIN
  -- Get full name from metadata or use email username
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Generate referral code
  user_ref_code := generate_referral_code(user_full_name, NEW.id);
  
  -- Insert profile (SECURITY DEFINER allows this to bypass RLS)
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    referral_code,
    rating,
    total_ratings,
    completed_tasks,
    published_tasks,
    successful_referrals,
    has_referral_discount
  ) VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    user_ref_code,
    0.00,
    0,
    0,
    0,
    0,
    false
  );
  
  -- Create free subscription for user
  INSERT INTO public.subscriptions (
    user_id,
    status,
    plan_name,
    discount_percentage,
    monthly_price,
    discounted_price
  ) VALUES (
    NEW.id,
    'free',
    'free',
    0,
    0.00,
    0.00
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure INSERT policy exists for profiles (needed for manual upserts from frontend)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
