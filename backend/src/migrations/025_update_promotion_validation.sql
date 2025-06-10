-- Create or replace the validation function to remove date order check
CREATE OR REPLACE FUNCTION check_promotion_date_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate that the date is after join date
    IF EXISTS (
        SELECT 1 
        FROM hr_employees 
        WHERE employee_id = NEW.employee_id 
        AND join_date > NEW.effective_date
    ) THEN
        RAISE EXCEPTION 'Promotion date cannot be before join date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS ensure_promotion_date_order ON hr_employee_promotions;
CREATE TRIGGER ensure_promotion_date_order
BEFORE INSERT OR UPDATE ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION check_promotion_date_order(); 