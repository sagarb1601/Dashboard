-- Create project_status table
CREATE TABLE IF NOT EXISTS project_status (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id),
    status TEXT CHECK (status IN ('Ongoing', 'Completed', 'Just Boarded')) NOT NULL,
    updated_by INTEGER REFERENCES hr_employees(employee_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 