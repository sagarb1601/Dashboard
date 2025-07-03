-- Migration 085: Add payment completion date to purchase_orders table

-- Add payment_completion_date column to purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_completion_date DATE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_date ON purchase_orders(payment_completion_date); 