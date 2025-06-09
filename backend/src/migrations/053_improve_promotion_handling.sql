-- Create promotion audit log table
CREATE TABLE hr_promotion_audit_log (
    id SERIAL PRIMARY KEY,
    promotion_id INTEGER REFERENCES hr_employee_promotions(id) ON DELETE SET NULL,
    employee_id INTEGER REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER REFERENCES hr_employees(employee_id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create promotion batch tracking table
CREATE TABLE hr_promotion_batch_uploads (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    uploaded_by INTEGER REFERENCES hr_employees(employee_id) ON DELETE SET NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_records INTEGER,
    successful_records INTEGER,
    failed_records INTEGER,
    status VARCHAR(20) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    error_log JSONB
);

-- Add unique constraint to prevent multiple promotions on same date
ALTER TABLE hr_employee_promotions
ADD CONSTRAINT unique_employee_date UNIQUE (employee_id, effective_date);

-- Create function to validate promotion sequence
CREATE OR REPLACE FUNCTION validate_promotion_sequence()
RETURNS TRIGGER AS $$
DECLARE
    prev_level INTEGER;
BEGIN
    -- Get the level from previous promotion
    SELECT level INTO prev_level
    FROM hr_employee_promotions
    WHERE employee_id = NEW.employee_id
    AND effective_date < NEW.effective_date
    ORDER BY effective_date DESC
    LIMIT 1;

    -- If no previous promotion, get initial level from employee
    IF prev_level IS NULL THEN
        SELECT COALESCE(
            (SELECT d.level FROM hr_designations d 
             WHERE d.designation_id = e.initial_designation_id),
            0
        ) INTO prev_level
        FROM hr_employees e
        WHERE e.employee_id = NEW.employee_id;
    END IF;

    -- Validate level progression
    IF NEW.level <= prev_level THEN
        RAISE EXCEPTION 'New promotion level (%) must be higher than previous level (%)', 
            NEW.level, prev_level;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level validation
CREATE TRIGGER validate_promotion_level
BEFORE INSERT OR UPDATE ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION validate_promotion_sequence();

-- Create function to log promotion changes
CREATE OR REPLACE FUNCTION log_promotion_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO hr_promotion_audit_log (
            promotion_id,
            employee_id,
            action_type,
            new_data,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.employee_id,
            'INSERT',
            row_to_json(NEW),
            current_setting('app.current_user_id')::INTEGER
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO hr_promotion_audit_log (
            promotion_id,
            employee_id,
            action_type,
            old_data,
            new_data,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.employee_id,
            'UPDATE',
            row_to_json(OLD),
            row_to_json(NEW),
            current_setting('app.current_user_id')::INTEGER
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO hr_promotion_audit_log (
            promotion_id,
            employee_id,
            action_type,
            old_data,
            changed_by
        ) VALUES (
            OLD.id,
            OLD.employee_id,
            'DELETE',
            row_to_json(OLD),
            current_setting('app.current_user_id')::INTEGER
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
CREATE TRIGGER log_promotion_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON hr_employee_promotions
FOR EACH ROW
EXECUTE FUNCTION log_promotion_changes();

-- Add indexes for better performance
CREATE INDEX idx_promotion_audit_log_employee ON hr_promotion_audit_log(employee_id);
CREATE INDEX idx_promotion_audit_log_date ON hr_promotion_audit_log(changed_at);
CREATE INDEX idx_promotion_batch_uploads_date ON hr_promotion_batch_uploads(upload_date); 