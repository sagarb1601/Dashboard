-- Migration 084: Add created_at column to purchase_orders table

-- Add created_at column to purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
 
-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at); 