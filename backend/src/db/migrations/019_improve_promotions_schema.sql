-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS ensure_promotion_date_order ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_date_order();
DROP TRIGGER IF EXISTS ensure_promotion_chain ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_chain();

-- Add promotion_type enum
CREATE TYPE promotion_type AS ENUM (
    'REGULAR',
    'SPECIAL',
    'MACP',
    'NFSG',
    'OTHER'
);

-- Add new columns to hr_employee_promotions
ALTER TABLE hr_employee_promotions
ADD COLUMN promotion_type promotion_type NOT NULL DEFAULT 'REGULAR',
ADD COLUMN promotion_order INTEGER NOT NULL DEFAULT 1,
ADD COLUMN pay_level INTEGER,
ADD COLUMN pay_matrix_cell INTEGER,
ADD COLUMN order_reference TEXT,
ADD COLUMN order_date DATE;

-- Create function to auto-calculate promotion order
CREATE OR REPLACE FUNCTION calculate_promotion_order()
RETURNS TRIGGER AS $$
BEGIN
    NEW.promotion_order := (
        SELECT COALESCE(MAX(promotion_order), 0) + 1
        FROM hr_employee_promotions
        WHERE employee_id = NEW.employee_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto promotion order
CREATE TRIGGER set_promotion_order
BEFORE INSERT ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION calculate_promotion_order();

-- Create function to validate promotion dates and chain
CREATE OR REPLACE FUNCTION validate_promotion()
RETURNS TRIGGER AS $$
DECLARE
    prev_promotion RECORD;
    next_promotion RECORD;
    emp_join_date DATE;
BEGIN
    -- Get employee join date
    SELECT join_date INTO emp_join_date
    FROM hr_employees
    WHERE employee_id = NEW.employee_id;

    -- Check if promotion date is after join date
    IF NEW.effective_date < emp_join_date THEN
        RAISE EXCEPTION 'Promotion date cannot be before employee join date';
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

    -- Validate designation chain
    IF prev_promotion IS NULL THEN
        -- First promotion must start from initial designation
        IF NEW.from_designation_id != (
            SELECT initial_designation_id 
            FROM hr_employees 
            WHERE employee_id = NEW.employee_id
        ) THEN
            RAISE EXCEPTION 'First promotion must start from initial designation';
        END IF;
    ELSE
        -- Subsequent promotions must follow the chain
        IF NEW.from_designation_id != prev_promotion.to_designation_id THEN
            RAISE EXCEPTION 'Promotion chain broken - from_designation must match previous promotion''s to_designation';
        END IF;
    END IF;

    -- Validate level progression
    IF NEW.level <= COALESCE(prev_promotion.level, 0) THEN
        RAISE EXCEPTION 'New level must be higher than previous level';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive validation trigger
CREATE TRIGGER validate_promotion_changes
BEFORE INSERT OR UPDATE ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION validate_promotion();

-- Add indexes for better performance
CREATE INDEX idx_employee_promotions_dates ON hr_employee_promotions(employee_id, effective_date);
CREATE INDEX idx_employee_promotions_type ON hr_employee_promotions(promotion_type);

-- Add constraints
ALTER TABLE hr_employee_promotions
ADD CONSTRAINT check_pay_level CHECK (pay_level > 0),
ADD CONSTRAINT check_pay_matrix_cell CHECK (pay_matrix_cell > 0),
ADD CONSTRAINT check_level CHECK (level > 0);

-- Update existing records with default promotion type
UPDATE hr_employee_promotions SET promotion_type = 'REGULAR' WHERE promotion_type IS NULL;

-- Update promotion orders for existing records
WITH ordered_promotions AS (
    SELECT 
        id,
        employee_id,
        ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY effective_date) as new_order
    FROM hr_employee_promotions
)
UPDATE hr_employee_promotions p
SET promotion_order = op.new_order
FROM ordered_promotions op
WHERE p.id = op.id; 