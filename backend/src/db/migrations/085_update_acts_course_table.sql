-- Migration 085: Update acts_course table with status and batch_type fields

-- Add new columns to acts_course table
ALTER TABLE acts_course 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
ADD COLUMN IF NOT EXISTS batch_type VARCHAR(10) NOT NULL DEFAULT 'February' CHECK (batch_type IN ('February', 'August'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_acts_course_status ON acts_course(status);
CREATE INDEX IF NOT EXISTS idx_acts_course_batch_type ON acts_course(batch_type);
CREATE INDEX IF NOT EXISTS idx_acts_course_year ON acts_course(year);

-- Add comments for documentation
COMMENT ON COLUMN acts_course.status IS 'Batch status: ongoing or completed';
COMMENT ON COLUMN acts_course.batch_type IS 'Batch type: February or August'; 