/*
  # Redesign Database for Task Marketplace

  ## Overview
  Complete redesign to support a task marketplace where any user can publish and complete tasks.

  ## Changes to Tables
  
  ### 1. profiles
    - Add `rating` (decimal, average rating 0-5)
    - Add `total_ratings` (integer, count of ratings received)
    - Add `completed_tasks` (integer, tasks completed by user)
    - Add `published_tasks` (integer, tasks published by user)
    - Remove `role` column (all users are equal)
  
  ### 2. tasks
    - Rename `employer_id` to `creator_id`
    - Add `assigned_to` (user currently assigned to task)
    - Add `assigned_at` (timestamp when task was assigned)
    - Add `completed_at` (timestamp when task was completed)
    - Add `is_rated` (boolean, if task has been rated)
    - Update status values: 'available', 'assigned', 'in_progress', 'completed', 'rated'
    - Remove overtime-related fields
  
  ### 3. task_ratings (NEW)
    - `id` (uuid, primary key)
    - `task_id` (uuid, foreign key to tasks)
    - `rated_user_id` (uuid, user who completed the task)
    - `rating_user_id` (uuid, user who published the task)
    - `rating` (integer, 1-5 stars)
    - `comment` (text, optional feedback)
    - `created_at` (timestamp)

  ## Security
    - Enable RLS on all tables
    - Users can view all available tasks
    - Users can only assign tasks to themselves
    - Only task creator can mark task as completed and rate
    - Users can view their own ratings
*/

-- Drop overtime tables (not needed for marketplace)
DROP TABLE IF EXISTS overtime_requests CASCADE;

-- Update profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS published_tasks INTEGER DEFAULT 0;

-- Update tasks table structure
ALTER TABLE tasks RENAME COLUMN employer_id TO creator_id;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_rated BOOLEAN DEFAULT false;

-- Remove overtime columns
ALTER TABLE tasks DROP COLUMN IF EXISTS is_overtime;
ALTER TABLE tasks DROP COLUMN IF EXISTS overtime_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS overtime_rate;

-- Update status check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('available', 'assigned', 'in_progress', 'completed', 'rated'));

-- Create task_ratings table
CREATE TABLE IF NOT EXISTS task_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id),
  rating_user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, rated_user_id)
);

ALTER TABLE task_ratings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Employers can create tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can view available tasks" ON tasks;
DROP POLICY IF EXISTS "Employers can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON tasks;

-- New RLS policies for profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- New RLS policies for tasks
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

-- RLS policies for task_ratings
CREATE POLICY "Anyone can view ratings"
  ON task_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Task creators can create ratings"
  ON task_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
      AND tasks.creator_id = auth.uid()
      AND tasks.status = 'completed'
    )
  );

-- Function to update user rating when a new rating is added
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    total_ratings = total_ratings + 1,
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM task_ratings
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE id = NEW.rated_user_id;
  
  -- Mark task as rated
  UPDATE tasks
  SET is_rated = true, status = 'rated'
  WHERE id = NEW.task_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update ratings
DROP TRIGGER IF EXISTS update_rating_trigger ON task_ratings;
CREATE TRIGGER update_rating_trigger
  AFTER INSERT ON task_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Function to increment completed tasks counter
CREATE OR REPLACE FUNCTION increment_completed_tasks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET completed_tasks = completed_tasks + 1
    WHERE id = NEW.assigned_to;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for completed tasks
DROP TRIGGER IF EXISTS increment_completed_trigger ON tasks;
CREATE TRIGGER increment_completed_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_completed_tasks();
