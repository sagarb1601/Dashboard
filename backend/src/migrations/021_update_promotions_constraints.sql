-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS validate_promotion_changes ON hr_employee_promotions;
DROP FUNCTION IF EXISTS validate_promotion();

-- Create improved validation function
CREATE OR REPLACE FUNCTION validate_promotion()
RETURNS TRIGGER AS $$
DECLARE
    prev_promotion RECORD;
    next_promotion RECORD;
    emp_initial_designation INTEGER;
    emp_join_date DATE;
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

    -- Get previous promotion
    SELECT * INTO prev_promotion
    FROM hr_employee_promotions
    WHERE employee_id = NEW.employee_id
    AND effective_date < NEW.effective_date
    ORDER BY effective_date DESC
    LIMIT 1;

    -- Get next promotion
    SELECT * INTO next_promotion
    FROM hr_employee_promotions
    WHERE employee_id = NEW.employee_id
    AND effective_date > NEW.effective_date
    AND id != NEW.id
    ORDER BY effective_date ASC
    LIMIT 1;

    -- Validate date order
    IF prev_promotion IS NOT NULL AND NEW.effective_date <= prev_promotion.effective_date THEN
        RAISE EXCEPTION 'Promotion date must be after previous promotion date (%)' , prev_promotion.effective_date;
    END IF;

    IF next_promotion IS NOT NULL AND NEW.effective_date >= next_promotion.effective_date THEN
        RAISE EXCEPTION 'Promotion date must be before next promotion date (%)' , next_promotion.effective_date;
    END IF;

    -- Validate promotion chain
    IF prev_promotion IS NULL THEN
        -- First promotion must start from initial designation
        IF NEW.from_designation_id != emp_initial_designation THEN
            RAISE EXCEPTION 'First promotion must start from initial designation (ID: %)', emp_initial_designation;
        END IF;
    ELSE
        -- Subsequent promotions must follow the chain
        IF NEW.from_designation_id != prev_promotion.to_designation_id THEN
            RAISE EXCEPTION 'Promotion must start from previous promotion''s designation (Expected: %, Got: %)', 
                prev_promotion.to_designation_id, NEW.from_designation_id;
        END IF;
    END IF;

    -- Update employee's current designation if this is the latest promotion
    IF next_promotion IS NULL THEN
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