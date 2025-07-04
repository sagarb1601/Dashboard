-- Add employee_type column to hr_employees table
ALTER TABLE hr_employees 
ADD COLUMN IF NOT EXISTS employee_type VARCHAR(100);

-- Add initial_designation_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_employees' 
        AND column_name = 'initial_designation_id'
    ) THEN
        ALTER TABLE hr_employees 
        ADD COLUMN initial_designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL;
        
        -- Update existing records to set initial_designation_id same as current designation_id
        UPDATE hr_employees 
        SET initial_designation_id = designation_id
        WHERE initial_designation_id IS NULL;
    END IF;
END $$;

-- Create index for employee_type for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_type ON hr_employees(employee_type);

-- Create index for employees without technical group (for group assignment UI)
CREATE INDEX IF NOT EXISTS idx_employees_without_group ON hr_employees(technical_group_id) WHERE technical_group_id IS NULL; 