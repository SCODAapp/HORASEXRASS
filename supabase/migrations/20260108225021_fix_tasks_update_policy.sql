/*
  # Fix tasks update policy

  1. Changes
    - Drop and recreate the update policy for tasks
    - Ensure the WITH CHECK clause allows all updates by task owner
    
  2. Security
    - Maintain ownership verification
    - Allow employers to update all fields of their own tasks including status changes
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Employers can update own tasks" ON tasks;

-- Recreate with correct WITH CHECK
CREATE POLICY "Employers can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);
