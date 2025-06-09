-- First drop the existing foreign key constraints
ALTER TABLE amc_contracts 
    DROP CONSTRAINT IF EXISTS amc_contracts_equipment_id_fkey,
    DROP CONSTRAINT IF EXISTS amc_contracts_amcprovider_id_fkey;

-- Then add them back with ON DELETE CASCADE
ALTER TABLE amc_contracts
    ADD CONSTRAINT amc_contracts_equipment_id_fkey 
    FOREIGN KEY (equipment_id) 
    REFERENCES admin_equipments(equipment_id) 
    ON DELETE CASCADE;

ALTER TABLE amc_contracts
    ADD CONSTRAINT amc_contracts_amcprovider_id_fkey 
    FOREIGN KEY (amcprovider_id) 
    REFERENCES amc_providers(amcprovider_id) 
    ON DELETE CASCADE; 