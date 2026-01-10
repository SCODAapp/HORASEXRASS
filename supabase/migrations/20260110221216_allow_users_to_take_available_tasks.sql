/*
  # Allow Users to Take Available Tasks

  ## Problem
  Users cannot take available tasks because RLS policies don't allow them to update
  tasks where they are neither the creator nor already assigned.

  ## Solution
  Add a new policy that allows any authenticated user to update tasks that are
  currently available (status = 'available' and assigned_to IS NULL) to assign
  themselves to it.

  ## Security
  - Only allows updating available tasks
  - Only allows setting assigned_to to the current user
  - Cannot be used to steal tasks from others
*/

-- Add policy to allow users to take available tasks
CREATE POLICY "Users can take available tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    status = 'available' 
    AND assigned_to IS NULL
  )
  WITH CHECK (
    status = 'assigned'
    AND assigned_to = auth.uid()
  );
