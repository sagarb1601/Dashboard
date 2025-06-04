-- Add unique constraint to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Function to safely add gender column if it doesn't exist
DO $$ 
BEGIN 
    -- Check if gender column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_staff' 
        AND column_name = 'gender'
    ) THEN
        -- Add gender column only if it doesn't exist
        ALTER TABLE admin_staff ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'));
        
        -- Update existing rows with a default gender
        UPDATE admin_staff SET gender = 'OTHER' WHERE gender IS NULL;
        
        -- Make gender column NOT NULL
        ALTER TABLE admin_staff ALTER COLUMN gender SET NOT NULL;
    END IF;
END $$; 