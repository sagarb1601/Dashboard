-- Add status column to travels table
ALTER TABLE travels 
ADD COLUMN status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'not_going', 'deputing'));

-- Add comment to explain the status values
COMMENT ON COLUMN travels.status IS 'Status of travel: going, not_going, or deputing';
COMMENT ON COLUMN travels.remarks IS 'Remarks when status is deputing - specifies who is being sent instead'; 