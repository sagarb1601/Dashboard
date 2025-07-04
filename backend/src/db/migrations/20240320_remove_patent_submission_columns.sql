-- Migration to remove submitted_by and created_by columns from patents table
BEGIN;

-- Drop foreign key constraints if they exist
DO $$ 
BEGIN
    -- Drop submitted_by foreign key if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'patents_submitted_by_fkey'
    ) THEN
        ALTER TABLE patents DROP CONSTRAINT patents_submitted_by_fkey;
    END IF;

    -- Drop created_by foreign key if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'patents_created_by_fkey'
    ) THEN
        ALTER TABLE patents DROP CONSTRAINT patents_created_by_fkey;
    END IF;
END $$;

-- Drop the columns
ALTER TABLE patents 
    DROP COLUMN IF EXISTS submitted_by,
    DROP COLUMN IF EXISTS created_by;

-- Update patent_status_history table to use updated_by_group consistently
ALTER TABLE patent_status_history 
    DROP COLUMN IF EXISTS updated_by,
    ADD COLUMN IF NOT EXISTS updated_by_group INTEGER REFERENCES technical_groups(group_id);

COMMIT; 