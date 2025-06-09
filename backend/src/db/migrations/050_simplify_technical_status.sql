-- First drop the technical_project_status table since it references technical_projects
DROP TABLE IF EXISTS technical_project_status CASCADE;

-- Then drop the technical_projects table
DROP TABLE IF EXISTS technical_projects CASCADE;

-- Create the new technical_project_status table that references finance_projects
CREATE TABLE IF NOT EXISTS technical_project_status (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('Ongoing', 'Completed', 'Just Boarded')) NOT NULL,
    updated_by INTEGER REFERENCES hr_employees(employee_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for better performance
CREATE INDEX idx_technical_project_status_project ON technical_project_status(project_id); 