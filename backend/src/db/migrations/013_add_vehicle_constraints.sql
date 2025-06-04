-- Enable btree_gist extension if not already enabled
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add constraints to vehicle_servicing table
ALTER TABLE vehicle_servicing
ADD CONSTRAINT service_dates_check 
CHECK (next_service_date > service_date);

ALTER TABLE vehicle_servicing
ADD CONSTRAINT no_service_overlap 
EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(service_date, next_service_date, '[]') WITH &&
);

-- Add constraints to vehicle_insurance table
ALTER TABLE vehicle_insurance
ADD CONSTRAINT insurance_dates_check 
CHECK (insurance_end_date > insurance_start_date);

ALTER TABLE vehicle_insurance
ADD CONSTRAINT policy_number_unique 
UNIQUE (policy_number);

ALTER TABLE vehicle_insurance
ADD CONSTRAINT no_insurance_overlap 
EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(insurance_start_date, insurance_end_date, '[]') WITH &&
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_servicing_dates 
ON vehicle_servicing (vehicle_id, service_date, next_service_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_dates 
ON vehicle_insurance (vehicle_id, insurance_start_date, insurance_end_date);

CREATE INDEX IF NOT EXISTS idx_insurance_policy_number 
ON vehicle_insurance (policy_number); 