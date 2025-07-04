-- Drop the existing foreign key constraint
ALTER TABLE grant_received 
DROP CONSTRAINT IF EXISTS grant_received_project_id_fkey;

-- Add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE grant_received
ADD CONSTRAINT grant_received_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES finance_projects(project_id) 
ON DELETE CASCADE; 