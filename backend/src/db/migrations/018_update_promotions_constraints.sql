-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS ensure_promotion_date_order ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_date_order();
DROP TRIGGER IF EXISTS ensure_promotion_chain ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_chain();

-- Create function to check promotion date order
CREATE OR REPLACE FUNCTION check_promotion_date_order()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM hr_employee_promotions 
        WHERE employee_id = NEW.employee_id 
        AND effective_date >= NEW.effective_date
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Promotion dates must be in chronological order';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for date order
CREATE TRIGGER ensure_promotion_date_order
BEFORE INSERT OR UPDATE ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION check_promotion_date_order();

-- Add trigger to ensure from_designation matches previous promotion's to_designation
CREATE OR REPLACE FUNCTION check_promotion_chain()
RETURNS TRIGGER AS $$
BEGIN
    -- For first promotion, check against initial designation
    IF NOT EXISTS (
        SELECT 1 FROM hr_employee_promotions 
        WHERE employee_id = NEW.employee_id 
        AND effective_date < NEW.effective_date
    ) THEN
        IF NEW.from_designation_id != (
            SELECT initial_designation_id 
            FROM hr_employees 
            WHERE employee_id = NEW.employee_id
        ) THEN
            RAISE EXCEPTION 'First promotion must start from initial designation';
        END IF;
    ELSE
        -- For subsequent promotions, check against previous promotion
        IF NEW.from_designation_id != (
            SELECT to_designation_id 
            FROM hr_employee_promotions 
            WHERE employee_id = NEW.employee_id 
            AND effective_date < NEW.effective_date 
            ORDER BY effective_date DESC 
            LIMIT 1
        ) THEN
            RAISE EXCEPTION 'Promotion chain broken - from_designation must match previous promotion''s to_designation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for promotion chain
CREATE TRIGGER ensure_promotion_chain
BEFORE INSERT OR UPDATE ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION check_promotion_chain(); 