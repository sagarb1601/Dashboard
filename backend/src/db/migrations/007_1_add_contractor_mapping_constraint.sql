-- Add constraint to prevent overlapping date ranges for the same department
CREATE OR REPLACE FUNCTION check_date_overlap() 
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM admin_contractor_department_mapping
    WHERE department_id = NEW.department_id
    AND contract_id != COALESCE(NEW.contract_id, 0)  -- Exclude current record when updating
    AND (
      (NEW.start_date, NEW.end_date) OVERLAPS (start_date, end_date)
    )
  ) THEN
    RAISE EXCEPTION 'Date range overlaps with existing contract for this department';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_date_overlap_trigger ON admin_contractor_department_mapping;

-- Create trigger
CREATE TRIGGER check_date_overlap_trigger
  BEFORE INSERT OR UPDATE ON admin_contractor_department_mapping
  FOR EACH ROW
  EXECUTE FUNCTION check_date_overlap(); 