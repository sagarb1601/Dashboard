-- Fix timezone issues in calendar_events table
-- Convert TIMESTAMP columns to TIMESTAMPTZ to properly handle timezone information

-- First, add new columns with timezone support
ALTER TABLE calendar_events 
ADD COLUMN start_time_tz TIMESTAMPTZ,
ADD COLUMN end_time_tz TIMESTAMPTZ;

-- Copy existing data with timezone conversion
-- Assuming existing data is in local timezone (IST/UTC+5:30)
UPDATE calendar_events 
SET 
  start_time_tz = start_time AT TIME ZONE 'Asia/Kolkata',
  end_time_tz = end_time AT TIME ZONE 'Asia/Kolkata';

-- Drop old columns
ALTER TABLE calendar_events 
DROP COLUMN start_time,
DROP COLUMN end_time;

-- Rename new columns to original names
ALTER TABLE calendar_events 
RENAME COLUMN start_time_tz TO start_time;
ALTER TABLE calendar_events 
RENAME COLUMN end_time_tz TO end_time;

-- Add NOT NULL constraint back
ALTER TABLE calendar_events 
ALTER COLUMN start_time SET NOT NULL,
ALTER COLUMN end_time SET NOT NULL;

-- Recreate index
DROP INDEX IF EXISTS idx_calendar_events_start_time;
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);

-- Update trigger function to use TIMESTAMPTZ
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update created_at and updated_at columns to TIMESTAMPTZ
ALTER TABLE calendar_events 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Set default values with timezone
ALTER TABLE calendar_events 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC'); 