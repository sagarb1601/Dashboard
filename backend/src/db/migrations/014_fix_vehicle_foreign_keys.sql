-- Drop existing foreign key constraints
ALTER TABLE vehicle_servicing
DROP CONSTRAINT IF EXISTS vehicle_servicing_vehicle_id_fkey;

ALTER TABLE vehicle_insurance
DROP CONSTRAINT IF EXISTS vehicle_insurance_vehicle_id_fkey;

-- Re-add foreign key constraints with ON DELETE CASCADE
ALTER TABLE vehicle_servicing
ADD CONSTRAINT vehicle_servicing_vehicle_id_fkey
FOREIGN KEY (vehicle_id)
REFERENCES transport_vehicles(vehicle_id)
ON DELETE CASCADE;

ALTER TABLE vehicle_insurance
ADD CONSTRAINT vehicle_insurance_vehicle_id_fkey
FOREIGN KEY (vehicle_id)
REFERENCES transport_vehicles(vehicle_id)
ON DELETE CASCADE; 