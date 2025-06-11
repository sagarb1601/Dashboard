-- First add the new columns
ALTER TABLE hr_employee_promotions 
ADD COLUMN from_designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL,
ADD COLUMN to_designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL;

-- Update the new columns using the existing data
UPDATE hr_employee_promotions p
SET to_designation_id = p.designation_id;

-- For from_designation_id, get the previous designation or the employee's current designation
UPDATE hr_employee_promotions p
SET from_designation_id = COALESCE(
    (
        SELECT p2.designation_id
        FROM hr_employee_promotions p2
        WHERE p2.employee_id = p.employee_id
        AND p2.effective_date < p.effective_date
        ORDER BY p2.effective_date DESC
        LIMIT 1
    ),
    (
        SELECT e.designation_id
        FROM hr_employees e
        WHERE e.employee_id = p.employee_id
    )
);

-- Now drop the old column
ALTER TABLE hr_employee_promotions 
DROP COLUMN IF EXISTS designation_id;

-- Add NOT NULL constraints after data migration
ALTER TABLE hr_employee_promotions
ALTER COLUMN from_designation_id SET NOT NULL,
ALTER COLUMN to_designation_id SET NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_promotion_designations ON hr_employee_promotions(from_designation_id, to_designation_id); 