-- Create technical_projects table
CREATE TABLE IF NOT EXISTS technical_projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    project_description TEXT,
    group_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create technical_project_status table
CREATE TABLE IF NOT EXISTS technical_project_status (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES technical_projects(project_id),
    status TEXT CHECK (status IN ('Ongoing', 'Completed', 'Just Boarded')) NOT NULL,
    updated_by INTEGER REFERENCES hr_employees(employee_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 