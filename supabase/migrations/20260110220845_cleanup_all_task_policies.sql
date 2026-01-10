/*
  # Clean Up All Task Policies

  ## Problem
  Multiple conflicting RLS policies exist from previous migrations, causing
  tasks to not be visible properly.

  ## Changes
  1. Drop ALL existing policies on tasks table
  2. Recreate only the necessary policies for marketplace system
  
  ## Security
  - All users can view all tasks (marketplace model)
  - Only authenticated users can create tasks (must be creator)
  - Task creators can update and delete their tasks
  - Assigned users can update task status
*/

-- Drop ALL existing policies on tasks
DROP POLICY IF EXISTS "Employers can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can view pending and assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Employers can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Workers can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Assigned users can update task status" ON tasks;
DROP POLICY IF EXISTS "Task creators can update their tasks" ON tasks;
DROP POLICY IF EXISTS "Employers can update own tasks" ON tasks;

-- Create clean policies for marketplace system
CREATE POLICY "Anyone can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Task creators can update their tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Assigned users can update task status"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "Task creators can delete their tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);
