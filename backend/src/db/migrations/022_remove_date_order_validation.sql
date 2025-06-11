-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS validate_promotion_changes ON hr_employee_promotions;
DROP FUNCTION IF EXISTS validate_promotion();

-- Create improved validation function without date order checks
CREATE OR REPLACE FUNCTION validate_promotion()
RETURNS TRIGGER AS $$
DECLARE
    emp_initial_designation INTEGER;
    emp_join_date DATE;
    prev_designation INTEGER;
BEGIN
    -- Get employee details
    SELECT initial_designation_id, join_date 
    INTO emp_initial_designation, emp_join_date
    FROM hr_employees 
    WHERE employee_id = NEW.employee_id;

    -- Check if promotion date is after join date
    IF NEW.effective_date < emp_join_date THEN
        RAISE EXCEPTION 'Promotion date cannot be before employee join date (%)' , emp_join_date;
    END IF;

    -- Get the designation that should be the starting point for this promotion
    -- based on the previous promotion in chronological order
    SELECT to_designation_id INTO prev_designation
    FROM hr_employee_promotions
    WHERE employee_id = NEW.employee_id
    AND effective_date < NEW.effective_date
    ORDER BY effective_date DESC
    LIMIT 1;

    -- If no previous promotion exists, use initial designation
    IF prev_designation IS NULL THEN
        prev_designation := emp_initial_designation;
    END IF;

    -- Validate designation chain
    IF NEW.from_designation_id != prev_designation THEN
        RAISE EXCEPTION 'Promotion must start from previous designation (Expected: %, Got: %)', 
            prev_designation, NEW.from_designation_id;
    END IF;

    -- Update employee's current designation if this is the latest promotion
    IF NOT EXISTS (
        SELECT 1 
        FROM hr_employee_promotions
        WHERE employee_id = NEW.employee_id
        AND effective_date > NEW.effective_date
    ) THEN
        UPDATE hr_employees 
        SET designation_id = NEW.to_designation_id
        WHERE employee_id = NEW.employee_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
CREATE TRIGGER validate_promotion_changes
BEFORE INSERT OR UPDATE ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION validate_promotion();

-- Add comment explaining the validation rules
COMMENT ON FUNCTION validate_promotion() IS 'Validates promotion chain integrity without enforcing strict date order. Ensures from_designation matches previous chronological promotion''s to_designation.'; 