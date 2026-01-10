/*
  # Fix Foreign Key Constraints for Tasks Table

  ## Problem
  The foreign key constraint was not properly renamed when the column was renamed
  from employer_id to creator_id, causing frontend queries to fail.

  ## Changes
  1. Drop old foreign key constraint with wrong name
  2. Create new foreign key constraint with correct name matching the column
  3. Ensure assigned_to constraint also has correct name

  ## Security
  No changes to RLS policies
*/

-- Drop old constraints
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_employer_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- Add new constraints with correct names
ALTER TABLE tasks 
  ADD CONSTRAINT tasks_creator_id_fkey 
  FOREIGN KEY (creator_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE tasks 
  ADD CONSTRAINT tasks_assigned_to_fkey 
  FOREIGN KEY (assigned_to) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;
