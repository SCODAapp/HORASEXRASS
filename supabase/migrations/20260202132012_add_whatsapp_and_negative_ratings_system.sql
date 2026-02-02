/*
  # Add WhatsApp and Negative Ratings System

  ## Overview
  This migration adds WhatsApp contact functionality and a negative ratings system
  to enable coordination between employers and workers, and quality control.

  ## Changes Made

  ### 1. Profiles Table Updates
    - Added `whatsapp` column (optional phone number)
    - Added `negative_ratings_count` column (default 0)
    - Added `is_blocked` column (auto-blocks at 3+ negative ratings)

  ### 2. New Table: negative_ratings
    - Tracks all negative ratings given by task creators
    - Links creator (rater), worker (rated), and task
    - Includes timestamp and optional reason
    - Prevents duplicate ratings for same task/worker combination

  ### 3. Security (RLS Policies)
    - Users can view their own negative ratings
    - Only task creators can create negative ratings for their own tasks
    - Ratings are immutable once created (no updates/deletes)

  ### 4. Important Notes
    - Users with 3+ negative ratings are automatically blocked from taking tasks
    - System prevents rating the same worker twice for the same task
    - WhatsApp field is optional but recommended for coordination
*/

-- Add WhatsApp and ratings fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'negative_ratings_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN negative_ratings_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_blocked boolean DEFAULT false;
  END IF;
END $$;

-- Create negative_ratings table
CREATE TABLE IF NOT EXISTS negative_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, worker_id)
);

-- Enable RLS on negative_ratings
ALTER TABLE negative_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view ratings about themselves
DROP POLICY IF EXISTS "Users can view own negative ratings" ON negative_ratings;
CREATE POLICY "Users can view own negative ratings"
  ON negative_ratings FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid() OR creator_id = auth.uid());

-- Policy: Task creators can rate workers for their own tasks
DROP POLICY IF EXISTS "Task creators can rate workers for own tasks" ON negative_ratings;
CREATE POLICY "Task creators can rate workers for own tasks"
  ON negative_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
      AND tasks.creator_id = auth.uid()
    )
  );

-- Function to update negative ratings count and block status
CREATE OR REPLACE FUNCTION update_negative_ratings_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the worker's negative ratings count
  UPDATE profiles
  SET 
    negative_ratings_count = (
      SELECT COUNT(*) FROM negative_ratings WHERE worker_id = NEW.worker_id
    ),
    is_blocked = (
      SELECT COUNT(*) FROM negative_ratings WHERE worker_id = NEW.worker_id
    ) >= 3
  WHERE id = NEW.worker_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update count when new rating is added
DROP TRIGGER IF EXISTS trigger_update_negative_ratings_count ON negative_ratings;
CREATE TRIGGER trigger_update_negative_ratings_count
  AFTER INSERT ON negative_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_negative_ratings_count();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_negative_ratings_worker_id ON negative_ratings(worker_id);
CREATE INDEX IF NOT EXISTS idx_negative_ratings_task_id ON negative_ratings(task_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);