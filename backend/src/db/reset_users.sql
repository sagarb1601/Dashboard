-- Drop and recreate users table
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with the same structure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the users with correct bcrypt hashes
-- admin123 -> $2b$10$3EXjtu5X/siXOnlUxXpn8eVY4KHQnx1nMeUQ.Ce5Cej5d0bkLSQq2
-- finance123 -> $2b$10$29NTS5kl6dr.ClGF6E1eg.jsuUat6CbCJmQFTESseoD1sww4q.qKW
INSERT INTO users (username, password_hash, role) 
VALUES 
    ('admin', '$2b$10$3EXjtu5X/siXOnlUxXpn8eVY4KHQnx1nMeUQ.Ce5Cej5d0bkLSQq2', 'admin'),
    ('finance', '$2b$10$29NTS5kl6dr.ClGF6E1eg.jsuUat6CbCJmQFTESseoD1sww4q.qKW', 'finance'); 