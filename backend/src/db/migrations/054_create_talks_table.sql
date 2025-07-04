-- Create talks table
CREATE TABLE IF NOT EXISTS talks (
    id SERIAL PRIMARY KEY,
    speaker_name VARCHAR(255) NOT NULL,
    topic_role VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    talk_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_talks_talk_date ON talks(talk_date);
CREATE INDEX IF NOT EXISTS idx_talks_speaker_name ON talks(speaker_name);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_talks_updated_at
    BEFORE UPDATE ON talks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 