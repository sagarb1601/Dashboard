-- Add reporting_type column to finance_projects table
ALTER TABLE finance_projects
ADD COLUMN reporting_type TEXT NOT NULL DEFAULT 'FY' CHECK (reporting_type IN ('FY', 'PQ'));

-- Update existing projects to have FY as reporting type
UPDATE finance_projects
SET reporting_type = 'FY'
WHERE reporting_type IS NULL; 