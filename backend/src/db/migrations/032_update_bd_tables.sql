-- Add payment_duration to business_entities
ALTER TABLE business_entities
ADD COLUMN payment_duration VARCHAR(50); -- Monthly, Quarterly, etc.

-- Update HPC services table
ALTER TABLE hpc_services
ADD COLUMN payment_type VARCHAR(50),
ADD COLUMN order_value DECIMAL(15,2),
ADD COLUMN comments TEXT,
ADD COLUMN billing_start_date DATE,
ADD COLUMN billing_end_date DATE;

-- Update VAPT services table
ALTER TABLE vapt_services
ADD COLUMN payment_type VARCHAR(50),
ADD COLUMN order_value DECIMAL(15,2),
ADD COLUMN comments TEXT,
ADD COLUMN billing_start_date DATE,
ADD COLUMN billing_end_date DATE;

-- Add indexes for better performance
CREATE INDEX idx_business_entities_type ON business_entities(entity_type);
CREATE INDEX idx_business_entities_client ON business_entities(client_id);
CREATE INDEX idx_purchase_orders_entity ON purchase_orders_bd(entity_id, entity_type);
CREATE INDEX idx_business_group_mappings_entity ON business_group_mappings(entity_id);

-- Add constraints
ALTER TABLE business_entities
ADD CONSTRAINT valid_payment_duration 
CHECK (payment_duration IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time'));

ALTER TABLE hpc_services
ADD CONSTRAINT valid_hpc_billing_dates 
CHECK (billing_end_date >= billing_start_date);

ALTER TABLE vapt_services
ADD CONSTRAINT valid_vapt_billing_dates 
CHECK (billing_end_date >= billing_start_date); 