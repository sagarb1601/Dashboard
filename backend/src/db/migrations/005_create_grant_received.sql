-- Create grant_received table to track field-wise grant allocations
CREATE TABLE IF NOT EXISTS grant_received (
    grant_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id),
    field_id INTEGER REFERENCES budget_fields(field_id),
    received_date DATE NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, field_id, received_date)
);

-- Create grant_field_allocation table to track field-wise grant allocation
CREATE TABLE IF NOT EXISTS grant_field_allocation (
    allocation_id SERIAL PRIMARY KEY,
    grant_id INTEGER REFERENCES grant_received(grant_id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES budget_fields(field_id),
    amount DECIMAL(20, 2) NOT NULL,
    UNIQUE(grant_id, field_id)
); 