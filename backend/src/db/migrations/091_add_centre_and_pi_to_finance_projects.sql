-- Add centre and project_investigator_id columns to finance_projects table
ALTER TABLE finance_projects
  ADD COLUMN centre VARCHAR(10),
  ADD COLUMN project_investigator_id INTEGER REFERENCES hr_employees(employee_id);

-- No constraints on centre (UI will restrict to KP, EC1, EC2)
-- project_investigator_id is nullable and references hr_employees 