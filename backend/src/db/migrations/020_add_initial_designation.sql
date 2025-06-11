-- Add initial_designation_id column to hr_employees
ALTER TABLE hr_employees
ADD COLUMN initial_designation_id INTEGER REFERENCES hr_designations(designation_id);

-- Set initial_designation_id to current designation_id for existing employees
UPDATE hr_employees
SET initial_designation_id = designation_id
WHERE initial_designation_id IS NULL;

-- Make initial_designation_id NOT NULL for future records
ALTER TABLE hr_employees
ALTER COLUMN initial_designation_id SET NOT NULL;

-- Create trigger to prevent changes to initial_designation_id
CREATE OR REPLACE FUNCTION prevent_initial_designation_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.initial_designation_id IS NOT NULL AND NEW.initial_designation_id != OLD.initial_designation_id THEN
        RAISE EXCEPTION 'Cannot change initial designation once set';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_initial_designation_immutable
BEFORE UPDATE ON hr_employees
FOR EACH ROW
EXECUTE FUNCTION prevent_initial_designation_change();

-- Add index for better query performance
CREATE INDEX idx_employee_initial_designation ON hr_employees(initial_designation_id); 