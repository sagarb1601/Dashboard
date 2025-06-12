-- Add status column to amc_contracts table
ALTER TABLE amc_contracts 
ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' 
CHECK (status IN ('ACTIVE', 'INACTIVE'));

-- Update existing records to set status based on end_date
UPDATE amc_contracts 
SET status = CASE 
    WHEN end_date < CURRENT_DATE THEN 'INACTIVE'
    ELSE 'ACTIVE'
END; 