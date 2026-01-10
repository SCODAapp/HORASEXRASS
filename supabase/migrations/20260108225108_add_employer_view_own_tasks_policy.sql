/*
  # Add policy for employers to view their own tasks

  1. Changes
    - Add SELECT policy allowing employers to view all their own tasks regardless of status
    - This fixes the issue when completing tasks (status change to 'completed')
    
  2. Security
    - Employers can view all their own tasks (pending, assigned, completed, cancelled)
    - Other users can still only view pending and assigned tasks
*/

-- Add policy for employers to view their own tasks
CREATE POLICY "Employers can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = employer_id);

-- Also allow workers to view tasks assigned to them
CREATE POLICY "Workers can view assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = assigned_to);
