-- Drop existing business_group_mappings table and recreate with proper structure
DROP TABLE IF EXISTS business_group_mappings CASCADE;

CREATE TABLE IF NOT EXISTS business_group_mappings (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE CASCADE,
    contact_person_id INTEGER REFERENCES hr_employees(employee_id) ON DELETE SET NULL,
    role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_id, group_id)
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_group_mappings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to business_group_mappings
DROP TRIGGER IF EXISTS update_group_mappings_timestamp ON business_group_mappings;
CREATE TRIGGER update_group_mappings_timestamp
    BEFORE UPDATE ON business_group_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_group_mappings_timestamp();

-- Add indexes for better performance
CREATE INDEX idx_business_group_mappings_entity ON business_group_mappings(entity_id);
CREATE INDEX idx_business_group_mappings_group ON business_group_mappings(group_id);
CREATE INDEX idx_business_group_mappings_contact ON business_group_mappings(contact_person_id); 