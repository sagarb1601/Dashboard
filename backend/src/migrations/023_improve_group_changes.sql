-- Drop existing table and its dependencies
DROP TABLE IF EXISTS hr_employee_group_changes CASCADE;

-- Create improved hr_employee_group_changes table
CREATE TABLE hr_employee_group_changes (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr_employees(employee_id),
    from_group_id INTEGER REFERENCES hr_technical_groups(technical_group_id),
    to_group_id INTEGER REFERENCES hr_technical_groups(technical_group_id),
    effective_from_date DATE NOT NULL,
    effective_to_date DATE, -- NULL means current
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (effective_to_date IS NULL OR effective_from_date < effective_to_date),
    CONSTRAINT different_groups CHECK (from_group_id != to_group_id)
);

-- Create trigger function to handle group changes
CREATE OR REPLACE FUNCTION handle_group_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- When inserting a new group change
    IF TG_OP = 'INSERT' THEN
        -- Update previous group change's effective_to_date
        UPDATE hr_employee_group_changes
        SET effective_to_date = NEW.effective_from_date - INTERVAL '1 day'
        WHERE employee_id = NEW.employee_id 
        AND effective_to_date IS NULL
        AND id != NEW.id;
        
        -- Update employee's current group
        UPDATE hr_employees
        SET technical_group_id = NEW.to_group_id
        WHERE employee_id = NEW.employee_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for group changes
DROP TRIGGER IF EXISTS group_changes_trigger ON hr_employee_group_changes;
CREATE TRIGGER group_changes_trigger
AFTER INSERT ON hr_employee_group_changes
FOR EACH ROW
EXECUTE FUNCTION handle_group_changes(); 