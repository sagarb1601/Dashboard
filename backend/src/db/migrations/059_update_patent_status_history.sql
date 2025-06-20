-- Update patent_status_history table to use updated_by_group
BEGIN;

-- First check if the column exists
DO $$ 
BEGIN
    -- Drop the old column if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patent_status_history' 
        AND column_name = 'updated_by'
    ) THEN
        -- Drop any foreign key constraints first
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'patent_status_history_updated_by_fkey'
        ) THEN
            ALTER TABLE patent_status_history DROP CONSTRAINT patent_status_history_updated_by_fkey;
        END IF;

        -- Drop the old column
        ALTER TABLE patent_status_history DROP COLUMN updated_by;
    END IF;

    -- Add the new column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patent_status_history' 
        AND column_name = 'updated_by_group'
    ) THEN
        ALTER TABLE patent_status_history 
        ADD COLUMN updated_by_group INTEGER REFERENCES technical_groups(group_id);
    END IF;
END $$;

COMMIT; 