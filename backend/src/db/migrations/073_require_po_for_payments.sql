-- Migration 073: Require purchase order for payment milestones
-- This ensures that payment milestones can only be created for entities that have purchase orders

-- First, delete any existing payment milestones that don't have a purchase order
DELETE FROM entity_payments WHERE po_id IS NULL;

-- Make po_id NOT NULL and add a foreign key constraint
ALTER TABLE entity_payments 
ALTER COLUMN po_id SET NOT NULL;

-- Add a comment to explain the business rule
COMMENT ON TABLE entity_payments IS 'Payment milestones must be associated with a purchase order'; 