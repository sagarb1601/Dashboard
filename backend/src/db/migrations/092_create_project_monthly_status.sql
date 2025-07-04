-- Create project_monthly_status table for tracking monthly project status
CREATE TABLE project_monthly_status (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES finance_projects(project_id),
  status VARCHAR(10) NOT NULL CHECK (status IN ('RED', 'YELLOW', 'GREEN')),
  remarks TEXT,
  month DATE NOT NULL, -- Store as first day of month (e.g., 2024-06-01)
  last_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one status record per project per month
  UNIQUE(project_id, month)
);

-- Create index for efficient queries
CREATE INDEX idx_project_monthly_status_project_id ON project_monthly_status(project_id);
CREATE INDEX idx_project_monthly_status_month ON project_monthly_status(month);
CREATE INDEX idx_project_monthly_status_status ON project_monthly_status(status); 