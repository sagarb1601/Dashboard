-- Migration 076: Update services tables to match backend code structure

-- Add start_date and end_date columns to hpc_services table
ALTER TABLE hpc_services 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add start_date and end_date columns to vapt_services table  
ALTER TABLE vapt_services 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add constraints for the new date columns
ALTER TABLE hpc_services 
ADD CONSTRAINT check_hpc_service_dates 
CHECK (end_date >= start_date);

ALTER TABLE vapt_services 
ADD CONSTRAINT check_vapt_service_dates 
CHECK (end_date >= start_date);

-- Update entity_payments table to match backend expectations
ALTER TABLE entity_payments 
ALTER COLUMN status TYPE VARCHAR(50);

-- Drop existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'entity_payments_status_check' 
               AND table_name = 'entity_payments') THEN
        ALTER TABLE entity_payments DROP CONSTRAINT entity_payments_status_check;
    END IF;
END $$;

-- Add new status constraint
ALTER TABLE entity_payments 
ADD CONSTRAINT entity_payments_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'received')); 