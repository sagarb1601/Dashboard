-- Migration 083: Fix procurement_bids table to store individual bid records

-- First drop the foreign key constraint from purchase_orders table
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_selected_bid_id_fkey;

-- Drop the existing procurement_bids table
DROP TABLE IF EXISTS procurement_bids;

-- Recreate procurement_bids table with proper structure for individual bids
CREATE TABLE procurement_bids (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    bid_amount DECIMAL(15,2) NOT NULL,
    number_of_bids INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for better performance
CREATE INDEX idx_procurement_bids_procurement_id ON procurement_bids(procurement_id);

-- Re-add the foreign key constraint to purchase_orders table
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_selected_bid_id_fkey 
    FOREIGN KEY (selected_bid_id) REFERENCES procurement_bids(id) ON DELETE SET NULL; 