-- Remove the unique constraint on services.entity_id
ALTER TABLE services DROP CONSTRAINT IF EXISTS unique_service_entity;

-- Add an index for performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_services_entity_type ON services(entity_id, service_type); 