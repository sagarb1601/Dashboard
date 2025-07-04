-- Remove submitted_by and created_by columns from patents table
BEGIN;

-- Drop foreign key constraints if they exist
DO $$ 
BEGIN
    -- Drop submitted_by constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'patents_submitted_by_fkey'
    ) THEN
        ALTER TABLE patents DROP CONSTRAINT patents_submitted_by_fkey;
    END IF;

    -- Drop created_by constraint if it exists
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

COMMIT; 