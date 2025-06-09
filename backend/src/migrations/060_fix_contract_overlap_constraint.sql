-- First, let's clean up any existing triggers and functions
DROP TRIGGER IF EXISTS contract_overlap_check ON hr_contract_renewals;
DROP FUNCTION IF EXISTS check_contract_overlap();

-- Create a more robust function to check for overlapping contracts
CREATE OR REPLACE FUNCTION check_contract_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Check for any overlapping contracts
    SELECT COUNT(*)
    INTO overlap_count
    FROM hr_contract_renewals
    WHERE employee_id = NEW.employee_id
    AND id != COALESCE(NEW.id, -1)  -- Exclude current record when updating
    AND (
        (NEW.start_date <= end_date AND NEW.end_date >= start_date)
        OR
        (start_date <= NEW.end_date AND end_date >= NEW.start_date)
    );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Contract dates overlap with existing contract(s) for employee %', NEW.employee_id
        USING HINT = 'Check existing contracts for this employee and choose non-overlapping dates';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER contract_overlap_check
    BEFORE INSERT OR UPDATE ON hr_contract_renewals
    FOR EACH ROW
    EXECUTE FUNCTION check_contract_overlap();

-- Add an additional constraint to ensure end_date is after start_date
ALTER TABLE hr_contract_renewals 
    DROP CONSTRAINT IF EXISTS valid_contract_dates;

ALTER TABLE hr_contract_renewals
    ADD CONSTRAINT valid_contract_dates 
    CHECK (end_date > start_date);

-- Function to fix any existing overlapping contracts
CREATE OR REPLACE FUNCTION fix_overlapping_contracts()
RETURNS TABLE (
    employee_id INTEGER,
    overlapping_contracts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.employee_id,
        COUNT(*) as overlapping_count
    FROM hr_contract_renewals cr
    INNER JOIN hr_contract_renewals cr2 
        ON cr.employee_id = cr2.employee_id
        AND cr.id != cr2.id
        AND (
            (cr.start_date <= cr2.end_date AND cr.end_date >= cr2.start_date)
            OR
            (cr2.start_date <= cr.end_date AND cr2.end_date >= cr.start_date)
        )
    GROUP BY cr.employee_id
    HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- Check for any existing overlapping contracts
DO $$
DECLARE
    overlap_record RECORD;
BEGIN
    FOR overlap_record IN SELECT * FROM fix_overlapping_contracts() LOOP
        RAISE NOTICE 'Employee ID % has % overlapping contracts', 
            overlap_record.employee_id, 
            overlap_record.overlapping_contracts;
    END LOOP;
END $$; 