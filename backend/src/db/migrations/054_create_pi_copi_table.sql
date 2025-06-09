-- Create project_investigators table to store both PI and Co-PI assignments
CREATE TABLE IF NOT EXISTS project_investigators (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    role_type VARCHAR(10) NOT NULL CHECK (role_type IN ('PI', 'Co-PI')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES hr_employees(employee_id) ON DELETE CASCADE
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_project_investigators_updated_at
    BEFORE UPDATE ON project_investigators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to prevent multiple PIs for the same project
CREATE UNIQUE INDEX unique_project_pi ON project_investigators (project_id) 
WHERE role_type = 'PI'; 