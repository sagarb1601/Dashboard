-- Add unique constraint to hr_attrition table to prevent duplicate records
ALTER TABLE hr_attrition ADD CONSTRAINT unique_employee_attrition UNIQUE (employee_id);

-- Add a check to ensure we can't add attrition records for inactive employees
ALTER TABLE hr_attrition ADD CONSTRAINT check_employee_active 
CHECK (EXISTS (
    SELECT 1 FROM hr_employees e 
    WHERE e.employee_id = hr_attrition.employee_id 
    AND e.status = 'ACTIVE'
)); 