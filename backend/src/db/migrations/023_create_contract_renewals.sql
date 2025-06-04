CREATE TABLE hr_contract_renewals (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(employee_id),
    contract_type VARCHAR(10) NOT NULL CHECK (contract_type IN ('INITIAL', 'RENEWAL')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INTEGER NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_contract_dates CHECK (end_date > start_date),
    CONSTRAINT valid_duration CHECK (duration_months > 0 AND duration_months <= 36)
); 