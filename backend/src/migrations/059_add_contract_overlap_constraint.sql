-- Create a function to check for overlapping contracts
CREATE OR REPLACE FUNCTION check_contract_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there are any overlapping contracts for the same employee
    IF EXISTS (
        SELECT 1 FROM hr_contract_renewals
        WHERE employee_id = NEW.employee_id
        AND id != COALESCE(NEW.id, -1)  -- Exclude the current record when updating
        AND (
            (NEW.start_date, NEW.end_date) OVERLAPS (start_date, end_date)
        )
    ) THEN
        RAISE EXCEPTION 'Contract dates overlap with an existing contract for this employee';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS contract_overlap_check ON hr_contract_renewals;

-- Create the trigger
CREATE TRIGGER contract_overlap_check
    BEFORE INSERT OR UPDATE ON hr_contract_renewals
    FOR EACH ROW
    EXECUTE FUNCTION check_contract_overlap(); 