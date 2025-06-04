-- First ensure unique constraint exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to safely create or update users
CREATE OR REPLACE FUNCTION create_or_update_user(
    p_username VARCHAR,
    p_password VARCHAR,
    p_role VARCHAR
) RETURNS void AS $$
DECLARE
    v_salt VARCHAR;
    v_hash VARCHAR;
BEGIN
    -- Generate a salt and hash the password
    v_salt := gen_salt('bf', 10);
    v_hash := crypt(p_password, v_salt);
    
    -- First try to update existing user
    UPDATE users 
    SET password_hash = v_hash,
        role = p_role
    WHERE username = p_username;
    
    -- If no user was updated, insert new one
    IF NOT FOUND THEN
        INSERT INTO users (username, password_hash, role)
        VALUES (p_username, v_hash, p_role);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create default users
SELECT create_or_update_user('admin', 'admin123', 'admin');
SELECT create_or_update_user('finance', 'finance123', 'finance');

-- Drop the function as it's no longer needed
DROP FUNCTION create_or_update_user; 