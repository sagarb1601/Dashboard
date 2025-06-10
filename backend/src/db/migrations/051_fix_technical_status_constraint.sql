-- Add unique constraint on project_id to ensure one status per project
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_project_status'
    ) THEN
        ALTER TABLE technical_project_status ADD CONSTRAINT unique_project_status UNIQUE (project_id);
    END IF;
END $$;

-- Add index for better performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_technical_project_status_project ON technical_project_status(project_id); 