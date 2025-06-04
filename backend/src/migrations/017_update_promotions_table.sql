-- Drop the previous_designation_id column if it exists
ALTER TABLE hr_employee_promotions 
DROP COLUMN IF EXISTS previous_designation_id;

-- Add from_designation_id and to_designation_id columns
ALTER TABLE hr_employee_promotions 
DROP COLUMN IF EXISTS designation_id,
ADD COLUMN from_designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL,
ADD COLUMN to_designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL;

-- Update existing records to use the new structure
WITH latest_promotions AS (
    SELECT DISTINCT ON (employee_id) 
        employee_id,
        designation_id as current_designation_id
    FROM hr_employee_promotions
    ORDER BY employee_id, effective_date DESC
)
UPDATE hr_employee_promotions p
SET to_designation_id = p.designation_id,
    from_designation_id = COALESCE(
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

-- Add NOT NULL constraints after data migration
ALTER TABLE hr_employee_promotions
ALTER COLUMN from_designation_id SET NOT NULL,
ALTER COLUMN to_designation_id SET NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_promotion_designations ON hr_employee_promotions(from_designation_id, to_designation_id); 