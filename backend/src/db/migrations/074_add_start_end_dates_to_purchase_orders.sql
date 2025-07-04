-- Add start_date and end_date columns to purchase_orders_bd table
ALTER TABLE purchase_orders_bd 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Remove invoice_status column and its constraint
ALTER TABLE purchase_orders_bd DROP COLUMN IF EXISTS invoice_status;

-- Update existing records to have default dates if they are null
UPDATE purchase_orders_bd 
SET start_date = invoice_date, 
    end_date = invoice_date + INTERVAL '1 year'
WHERE start_date IS NULL OR end_date IS NULL;

-- Make start_date and end_date NOT NULL after setting defaults
ALTER TABLE purchase_orders_bd 
ALTER COLUMN start_date SET NOT NULL,
ALTER COLUMN end_date SET NOT NULL; 