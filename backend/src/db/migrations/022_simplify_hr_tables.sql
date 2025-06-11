-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS hr_employee_promotions CASCADE;
DROP TABLE IF EXISTS hr_employee_group_changes CASCADE;
DROP TABLE IF EXISTS hr_employee_attrition CASCADE;

-- Modify hr_employees table
ALTER TABLE hr_employees
DROP COLUMN IF EXISTS initial_designation_id;

-- Create hr_employee_promotions table
CREATE TABLE hr_employee_promotions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr_employees(employee_id),
    designation_id INTEGER REFERENCES hr_designations(designation_id),
    effective_from_date DATE NOT NULL,
    effective_to_date DATE, -- NULL means current
    level INTEGER NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (effective_to_date IS NULL OR effective_from_date < effective_to_date)
);

-- Create hr_employee_group_changes table
CREATE TABLE hr_employee_group_changes (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr_employees(employee_id),
    technical_group_id INTEGER REFERENCES hr_technical_groups(technical_group_id),
    effective_from_date DATE NOT NULL,
    effective_to_date DATE, -- NULL means current
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (effective_to_date IS NULL OR effective_from_date < effective_to_date)
);

-- Create hr_employee_attrition table
CREATE TABLE hr_employee_attrition (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr_employees(employee_id),
    attrition_date DATE NOT NULL,
    attrition_type VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add status column to hr_employees if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hr_employees' AND column_name = 'status'
    ) THEN
        ALTER TABLE hr_employees ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
    END IF;
END $$;

-- Create trigger function to handle promotion history
CREATE OR REPLACE FUNCTION handle_promotion_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- When inserting a new promotion
    IF TG_OP = 'INSERT' THEN
        -- Update previous promotion's effective_to_date
        UPDATE hr_employee_promotions
        SET effective_to_date = NEW.effective_from_date - INTERVAL '1 day'
        WHERE employee_id = NEW.employee_id 
        AND effective_to_date IS NULL
        AND id != NEW.id;
        
        -- Update employee's current designation
        UPDATE hr_employees
        SET designation_id = NEW.designation_id
        WHERE employee_id = NEW.employee_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for promotions
DROP TRIGGER IF EXISTS promotion_changes_trigger ON hr_employee_promotions;
CREATE TRIGGER promotion_changes_trigger
AFTER INSERT ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION handle_promotion_changes();

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
        SET technical_group_id = NEW.technical_group_id
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

-- Create trigger function to handle attrition
CREATE OR REPLACE FUNCTION handle_attrition()
RETURNS TRIGGER AS $$
BEGIN
    -- Update employee status when attrition record is added
    UPDATE hr_employees
    SET status = NEW.attrition_type
    WHERE employee_id = NEW.employee_id;
    
    -- Close any open promotions
    UPDATE hr_employee_promotions
    SET effective_to_date = NEW.attrition_date
    WHERE employee_id = NEW.employee_id 
    AND effective_to_date IS NULL;
    
    -- Close any open group changes
    UPDATE hr_employee_group_changes
    SET effective_to_date = NEW.attrition_date
    WHERE employee_id = NEW.employee_id 
    AND effective_to_date IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attrition
DROP TRIGGER IF EXISTS attrition_trigger ON hr_employee_attrition;
CREATE TRIGGER attrition_trigger
AFTER INSERT ON hr_employee_attrition
FOR EACH ROW
EXECUTE FUNCTION handle_attrition(); 