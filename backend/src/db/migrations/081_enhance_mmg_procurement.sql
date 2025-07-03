-- Migration 081: Enhance MMG Procurement Module
-- Add new columns and improve existing tables

-- 1. Add new columns to procurements table
ALTER TABLE procurements ADD COLUMN IF NOT EXISTS indent_date DATE;
ALTER TABLE procurements ADD COLUMN IF NOT EXISTS mmg_acceptance_date DATE;

-- 2. Update procurement_history table structure
-- First, backup existing data if needed
CREATE TABLE IF NOT EXISTS procurement_history_backup AS SELECT * FROM procurement_history;

-- Drop and recreate procurement_history with new structure
DROP TABLE IF EXISTS procurement_history CASCADE;

CREATE TABLE procurement_history (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    status_date DATE NOT NULL,
    remarks TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add bid_amount to procurement_bids table
ALTER TABLE procurement_bids ADD COLUMN IF NOT EXISTS bid_amount DECIMAL(15,2);

-- 4. Add status and selected_bid_id to purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS selected_bid_id INTEGER REFERENCES procurement_bids(id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_procurement_history_procurement_id ON procurement_history(procurement_id);
CREATE INDEX IF NOT EXISTS idx_procurement_history_status_date ON procurement_history(status_date);
CREATE INDEX IF NOT EXISTS idx_procurement_bids_amount ON procurement_bids(bid_amount);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_selected_bid ON purchase_orders(selected_bid_id); 