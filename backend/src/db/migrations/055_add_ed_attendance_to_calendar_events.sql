-- Add ED attendance fields to calendar_events table
ALTER TABLE calendar_events
  ADD COLUMN ed_attendance_status VARCHAR(32),
  ADD COLUMN ed_attendance_remarks TEXT,
  ADD COLUMN ed_attendance_updated_at TIMESTAMP; 