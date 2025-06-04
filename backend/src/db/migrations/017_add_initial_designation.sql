-- Add initial_designation_id column to hr_employees if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hr_employees' 
        AND column_name = 'initial_designation_id'
    ) THEN
        ALTER TABLE hr_employees 
        ADD COLUMN initial_designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL;

        -- Update existing records to set initial_designation_id same as current designation_id
        UPDATE hr_employees 
        SET initial_designation_id = designation_id 
        WHERE initial_designation_id IS NULL;

        -- Add NOT NULL constraint after data migration
        ALTER TABLE hr_employees 
        ALTER COLUMN initial_designation_id SET NOT NULL;

        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_employee_initial_designation ON hr_employees(initial_designation_id);
    END IF;
END $$; 