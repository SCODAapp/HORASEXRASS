/*
  # Fix Profile SELECT Policy Recursion

  1. Problem
    - "Employers can view all profiles" policy causes infinite recursion
    - The policy queries profiles table within itself to check if user is employer
    - Results in 500 Internal Server Error

  2. Solution
    - Drop the recursive policy
    - Create simple policy: users can only view their own profile
    - For employer functionality, we'll handle it at application level or use a different approach

  3. Security
    - Users can only view their own profile data
    - No recursion risk
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Employers can view all profiles" ON profiles;

-- Create simple non-recursive policy
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
