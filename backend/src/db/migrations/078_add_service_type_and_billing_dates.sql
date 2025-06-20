-- Migration 078: Add service type to business entities and billing dates to entity payments
-- This is a critical junction that affects BD Products, BD Projects, and BD Services

-- Step 1: Add service_type column without any constraints
ALTER TABLE business_entities 
ADD COLUMN service_type VARCHAR(50);

-- Step 2: Add billing dates to entity_payments table (affects all BD modules)
ALTER TABLE entity_payments 
ADD COLUMN billing_start_date DATE,
ADD COLUMN billing_end_date DATE;

-- Step 3: Add VAPT-specific fields (no database constraint for service_category)
ALTER TABLE vapt_services 
ADD COLUMN manpower_count INTEGER,
ADD COLUMN service_category VARCHAR(100);

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_entities_service_type ON business_entities(service_type);
CREATE INDEX IF NOT EXISTS idx_entity_payments_billing_dates ON entity_payments(billing_start_date, billing_end_date);
CREATE INDEX IF NOT EXISTS idx_vapt_services_category ON vapt_services(service_category); 