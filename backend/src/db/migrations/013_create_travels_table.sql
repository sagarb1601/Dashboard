-- Create travels table
CREATE TABLE travels (
    id SERIAL PRIMARY KEY,
    travel_type VARCHAR(20) NOT NULL CHECK (travel_type IN ('foreign', 'domestic')),
    location VARCHAR(200) NOT NULL,
    onward_date DATE NOT NULL,
    return_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    accommodation TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT travel_dates_check CHECK (return_date >= onward_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_travels_dates ON travels (onward_date, return_date);
CREATE INDEX idx_travels_type ON travels (travel_type);
CREATE INDEX idx_travels_location ON travels (location);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_travels_updated_at
    BEFORE UPDATE ON travels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 