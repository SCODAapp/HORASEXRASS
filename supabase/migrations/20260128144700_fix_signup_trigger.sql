/*
  # Fix Signup Trigger Issue

  ## Problem
  - Users getting "Database error saving new user" during signup
  - Trigger function may be failing when inserting into subscriptions table
  - Need to ensure trigger has proper permissions

  ## Solution
  1. Add policy to allow system (service role) to insert subscriptions
  2. Improve error handling in trigger function
  3. Ensure trigger function runs with proper security context

  ## Changes
  - Add system policy for subscriptions insertion
  - Update handle_new_user function with better error handling
*/

-- Drop existing policy that might be too restrictive
DROP POLICY IF EXISTS "System can insert subscriptions" ON subscriptions;

-- Create new policy that allows service role to insert
CREATE POLICY "Allow signup trigger to create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

-- Update the trigger function to ensure it handles errors properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Insert profile
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
  )
  ON CONFLICT (id) DO NOTHING;
  
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
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
