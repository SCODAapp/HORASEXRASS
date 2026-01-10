/*
  # Add date, time and geolocation to tasks

  1. Changes to tables
    - Add columns to `tasks` table:
      - `scheduled_date` (date) - Date when the task should be performed
      - `scheduled_time` (time) - Time when the task should be performed
      - `latitude` (numeric) - Latitude coordinate of task location
      - `longitude` (numeric) - Longitude coordinate of task location
      - `address` (text) - Full address for better location description
  
  2. Notes
    - These fields allow workers to find nearby tasks
    - Date and time help workers plan their schedule
    - Coordinates enable map visualization
*/

DO $$
BEGIN
  -- Add scheduled_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN scheduled_date date;
  END IF;

  -- Add scheduled_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN scheduled_time time;
  END IF;

  -- Add latitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE tasks ADD COLUMN latitude numeric(10, 8);
  END IF;

  -- Add longitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE tasks ADD COLUMN longitude numeric(11, 8);
  END IF;

  -- Add address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'address'
  ) THEN
    ALTER TABLE tasks ADD COLUMN address text;
  END IF;
END $$;
