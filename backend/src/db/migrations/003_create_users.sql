-- Skip users table creation as it already exists
SELECT 1;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Insert default users if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
        INSERT INTO users (username, password_hash, role)
        VALUES ('admin', '$2b$10$3NxM2Nx8m1GR3mfrXpvHvuupl3vJbvCZpGS3.4.M.bC5YGYK6nOYi', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'finance') THEN
        INSERT INTO users (username, password_hash, role)
        VALUES ('finance', '$2b$10$3NxM2Nx8m1GR3mfrXpvHvuupl3vJbvCZpGS3.4.M.bC5YGYK6nOYi', 'finance');
    END IF;
END $$; 