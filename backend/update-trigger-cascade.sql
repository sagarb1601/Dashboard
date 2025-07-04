-- Update trigger function to allow cascade deletion
-- Drop the current trigger and function
DROP TRIGGER IF EXISTS check_business_entity_usage ON business_entities;
DROP FUNCTION IF EXISTS check_business_entity_usage() CASCADE;

-- Create new trigger function that handles cascade deletion
CREATE OR REPLACE FUNCTION check_business_entity_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete corresponding record from products_bd
    DELETE FROM products_bd WHERE entity_id = OLD.id;
    
    -- Delete corresponding record from services_bd
    DELETE FROM services_bd WHERE entity_id = OLD.id;
    
    -- Delete corresponding record from projects_bd
    DELETE FROM projects_bd WHERE entity_id = OLD.id;
    
    -- Check if entity is used in purchase_orders_bd (don't cascade, just check)
    IF EXISTS (SELECT 1 FROM purchase_orders_bd WHERE entity_id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete business entity: It is referenced in purchase_orders_bd table';
    END IF;
    
    -- Check if entity is used in entity_payments (don't cascade, just check)
    IF EXISTS (SELECT 1 FROM entity_payments WHERE entity_id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete business entity: It is referenced in entity_payments table';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on business_entities table
CREATE TRIGGER check_business_entity_usage
    BEFORE DELETE ON business_entities
    FOR EACH ROW
    EXECUTE FUNCTION check_business_entity_usage();

-- Verify the trigger was created
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'check_business_entity_usage'; 