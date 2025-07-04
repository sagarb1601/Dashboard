-- Migration 071: Remove entity_payments check from trigger since it's handled in API

-- Drop the current trigger and function if they exist
DROP TRIGGER IF EXISTS check_business_entity_usage ON business_entities;
DROP FUNCTION IF EXISTS check_business_entity_usage() CASCADE;

-- Create new trigger function that handles cascade deletion including purchase orders
CREATE OR REPLACE FUNCTION check_business_entity_usage()
RETURNS TRIGGER AS $$
DECLARE
    po_count INTEGER;
BEGIN
    -- Count purchase orders for this entity
    SELECT COUNT(*) INTO po_count 
    FROM purchase_orders_bd 
    WHERE entity_id = OLD.id;
    
    -- If there are purchase orders, raise a warning but allow deletion
    IF po_count > 0 THEN
        RAISE WARNING 'Deleting business entity will also delete % purchase order(s)', po_count;
    END IF;
    
    -- Delete corresponding record from products_bd
    DELETE FROM products_bd WHERE entity_id = OLD.id;
    
    -- Delete corresponding record from services_bd
    DELETE FROM services_bd WHERE entity_id = OLD.id;
    
    -- Delete corresponding record from projects_bd
    DELETE FROM projects_bd WHERE entity_id = OLD.id;
    
    -- Delete corresponding purchase orders
    DELETE FROM purchase_orders_bd WHERE entity_id = OLD.id;
    
    -- Note: entity_payments check is now handled in the API endpoint
    -- to provide better user feedback
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on business_entities table
CREATE TRIGGER check_business_entity_usage
    BEFORE DELETE ON business_entities
    FOR EACH ROW
    EXECUTE FUNCTION check_business_entity_usage(); 