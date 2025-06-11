-- Create enum type for attrition reasons
CREATE TYPE attrition_reason AS ENUM (
    'SUPERANNUATION',
    'BETTER_OPPORTUNITY',
    'HIGHER_EDUCATION',
    'HEALTH_REASONS',
    'PERSONAL_REASONS',
    'RELOCATION',
    'PERFORMANCE_ISSUES',
    'CONTRACT_COMPLETION',
    'RETIREMENT',
    'OTHER'
);

-- Create employee promotions table
CREATE TABLE hr_employee_promotions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
    designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL,
    effective_date DATE NOT NULL,
    remarks TEXT,
    level INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create group transfer history table
CREATE TABLE hr_group_transfer_history (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
    from_group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE SET NULL,
    to_group_id INTEGER NOT NULL REFERENCES technical_groups(group_id) ON DELETE CASCADE,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attrition table
CREATE TABLE hr_attrition (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(employee_id) ON DELETE CASCADE,
    reason_for_leaving attrition_reason NOT NULL,
    reason_details TEXT,
    last_date DATE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_month CHECK (month BETWEEN 1 AND 12)
);

-- Create indexes for better query performance
CREATE INDEX idx_hr_employee_promotions_employee_id ON hr_employee_promotions(employee_id);
CREATE INDEX idx_hr_group_transfer_employee_id ON hr_group_transfer_history(employee_id);
CREATE INDEX idx_hr_attrition_employee_id ON hr_attrition(employee_id); 