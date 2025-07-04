-- Drop existing expenditure entries table
DROP TABLE IF EXISTS project_expenditure_entries CASCADE;

-- Create updated project_expenditure_entries table
CREATE TABLE IF NOT EXISTS project_expenditure_entries (
    expenditure_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES budget_fields(field_id) ON DELETE CASCADE,
    calendar_year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    amount_spent NUMERIC(15, 2) NOT NULL CHECK (amount_spent >= 0),
    expenditure_date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure unique expenditure entry per project, field, year, and quarter
    UNIQUE(project_id, field_id, calendar_year, quarter)
);

-- Create function to get financial year from date
CREATE OR REPLACE FUNCTION get_financial_year(date_val DATE)
RETURNS INTEGER AS $$
BEGIN
    IF EXTRACT(MONTH FROM date_val) >= 4 THEN
        RETURN EXTRACT(YEAR FROM date_val);
    ELSE
        RETURN EXTRACT(YEAR FROM date_val) - 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for financial year expenditures
CREATE OR REPLACE VIEW financial_year_expenditures AS
SELECT 
    project_id,
    field_id,
    get_financial_year(expenditure_date) as financial_year,
    SUM(amount_spent) as total_amount,
    COUNT(*) as number_of_entries,
    MIN(expenditure_date) as first_expenditure_date,
    MAX(expenditure_date) as last_expenditure_date
FROM project_expenditure_entries
GROUP BY project_id, field_id, get_financial_year(expenditure_date);

-- Create view for quarterly expenditures
CREATE OR REPLACE VIEW quarterly_expenditures AS
SELECT 
    project_id,
    field_id,
    calendar_year,
    quarter,
    amount_spent,
    expenditure_date,
    remarks,
    created_at,
    updated_at
FROM project_expenditure_entries;

-- Add indexes for better performance
CREATE INDEX idx_expenditure_project ON project_expenditure_entries(project_id);
CREATE INDEX idx_expenditure_field ON project_expenditure_entries(field_id);
CREATE INDEX idx_expenditure_year_quarter ON project_expenditure_entries(calendar_year, quarter);
CREATE INDEX idx_expenditure_date ON project_expenditure_entries(expenditure_date);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_expenditure_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenditure_timestamp
    BEFORE UPDATE ON project_expenditure_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_expenditure_timestamp(); 