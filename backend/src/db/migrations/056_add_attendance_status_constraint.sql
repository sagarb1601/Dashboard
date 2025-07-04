-- Add constraint for attendance status values
ALTER TABLE calendar_events
ADD CONSTRAINT check_attendance_status 
CHECK (ed_attendance_status IS NULL OR ed_attendance_status IN (
    'attending',
    'not_attending',
    'sending_representative'
));

-- Add comment for the column
COMMENT ON COLUMN calendar_events.ed_attendance_status IS 'ED attendance status: attending, not_attending, or sending_representative'; 