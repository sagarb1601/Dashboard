-- Add group_id column to finance_projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'finance_projects'
        AND column_name = 'group_id'
    ) THEN
        ALTER TABLE finance_projects
        ADD COLUMN group_id INTEGER REFERENCES technical_groups(group_id);

        -- Add index for better performance
        CREATE INDEX idx_finance_projects_group ON finance_projects(group_id);
    END IF;
END $$; 