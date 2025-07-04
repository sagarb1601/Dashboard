-- Revert purchase_orders_bd table back to original state
-- Remove start_date and end_date columns
ALTER TABLE purchase_orders_bd DROP COLUMN IF EXISTS start_date;
ALTER TABLE purchase_orders_bd DROP COLUMN IF EXISTS end_date;

-- Add back invoice_status column with original constraint
ALTER TABLE purchase_orders_bd 
ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(50) NOT NULL DEFAULT 'Pending' 
CHECK (invoice_status IN ('Pending', 'Approved', 'Rejected', 'Paid'));

-- Update any existing records to have default status
UPDATE purchase_orders_bd 
SET invoice_status = 'Pending' 
WHERE invoice_status IS NULL; 