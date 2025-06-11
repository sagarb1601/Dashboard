-- Add previous_designation_id column
ALTER TABLE hr_employee_promotions
ADD COLUMN previous_designation_id INTEGER REFERENCES hr_designations(designation_id);

-- Update existing records with previous designation from employees table
UPDATE hr_employee_promotions p
SET previous_designation_id = e.designation_id
FROM hr_employees e
WHERE p.employee_id = e.employee_id
AND p.previous_designation_id IS NULL;

-- Make previous_designation_id NOT NULL for future records
ALTER TABLE hr_employee_promotions
ALTER COLUMN previous_designation_id SET NOT NULL; 