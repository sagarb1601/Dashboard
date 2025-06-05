-- Drop existing business_entities table and recreate with proper structure
DROP TABLE IF EXISTS business_entities CASCADE;

CREATE TABLE IF NOT EXISTS business_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('product', 'project', 'service')),
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    payment_duration VARCHAR(50) CHECK (payment_duration IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to business_entities
DROP TRIGGER IF EXISTS update_business_entities_updated_at ON business_entities;
CREATE TRIGGER update_business_entities_updated_at
    BEFORE UPDATE ON business_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_business_entities_type ON business_entities(entity_type);
CREATE INDEX idx_business_entities_client ON business_entities(client_id);
CREATE INDEX idx_business_entities_dates ON business_entities(start_date, end_date); 