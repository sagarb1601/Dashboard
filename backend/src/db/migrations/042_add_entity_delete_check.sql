-- Create a function to check if a business entity can be deleted
CREATE OR REPLACE FUNCTION check_business_entity_usage()
RETURNS TRIGGER AS $$
DECLARE
    product_count INTEGER;
    project_count INTEGER;
    service_count INTEGER;
BEGIN
    -- Check if entity is used in products
    SELECT COUNT(*) INTO product_count
    FROM products
    WHERE entity_id = OLD.id;

    -- Check if entity is used in projects
    SELECT COUNT(*) INTO project_count
    FROM business_division_projects
    WHERE entity_id = OLD.id;

    -- Check if entity is used in services
    SELECT COUNT(*) INTO service_count
    FROM services
    WHERE entity_id = OLD.id;

    -- If entity is used anywhere, prevent deletion
    IF (product_count + project_count + service_count) > 0 THEN
        RAISE EXCEPTION 'Cannot delete business entity as it is being used in products, services, or projects';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check before deleting a business entity
DROP TRIGGER IF EXISTS check_business_entity_usage_trigger ON business_entities;
CREATE TRIGGER check_business_entity_usage_trigger
    BEFORE DELETE ON business_entities
    FOR EACH ROW
    EXECUTE FUNCTION check_business_entity_usage(); 