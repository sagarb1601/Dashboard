-- Drop existing tables with CASCADE
DROP TABLE IF EXISTS project_expenditure_entries CASCADE;
DROP TABLE IF EXISTS project_budget_entries CASCADE;
DROP TABLE IF EXISTS project_budget_fields_mapping CASCADE;
DROP TABLE IF EXISTS budget_fields CASCADE;
DROP TABLE IF EXISTS finance_projects CASCADE;

-- Create finance_projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS finance_projects (
    project_id SERIAL PRIMARY KEY,
    project_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    extension_end_date DATE,  -- Nullable, for future extensions
    total_value NUMERIC(15, 2) NOT NULL,
    funding_agency TEXT NOT NULL,
    duration_years INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create budget_fields table if it doesn't exist
CREATE TABLE IF NOT EXISTS budget_fields (
    field_id SERIAL PRIMARY KEY,
    field_name TEXT NOT NULL UNIQUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_budget_fields_mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_budget_fields_mapping (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES budget_fields(field_id) ON DELETE CASCADE,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_budget_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_budget_entries (
    entry_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES budget_fields(field_id) ON DELETE CASCADE,
    year_number INTEGER NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_expenditure_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_expenditure_entries (
    expenditure_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES budget_fields(field_id) ON DELETE CASCADE,
    year_number INTEGER NOT NULL,
    period_type TEXT NOT NULL,
    period_number INTEGER NOT NULL,
    amount_spent NUMERIC(15, 2) NOT NULL,
    expenditure_date DATE DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default budget fields if they don't exist
INSERT INTO budget_fields (field_name, is_default) VALUES
    ('Equipment', TRUE),
    ('Manpower', TRUE),
    ('Consumables', TRUE),
    ('Travel', TRUE),
    ('Contingency', TRUE),
    ('Overhead', TRUE)
ON CONFLICT (field_name) DO NOTHING; 