-- First remove the CASCADE delete from services table
ALTER TABLE services DROP CONSTRAINT fk_service_entity;
ALTER TABLE services ADD CONSTRAINT fk_service_entity 
    FOREIGN KEY (entity_id) REFERENCES business_entities(id) ON DELETE RESTRICT;

-- Remove CASCADE from products table
ALTER TABLE products DROP CONSTRAINT fk_product_entity;
ALTER TABLE products ADD CONSTRAINT fk_product_entity 
    FOREIGN KEY (entity_id) REFERENCES business_entities(id) ON DELETE RESTRICT;

-- Remove CASCADE from projects table
ALTER TABLE business_division_projects DROP CONSTRAINT fk_project_entity;
ALTER TABLE business_division_projects ADD CONSTRAINT fk_project_entity 
    FOREIGN KEY (entity_id) REFERENCES business_entities(id) ON DELETE RESTRICT;

-- Update the trigger function to be more specific
CREATE OR REPLACE FUNCTION check_business_entity_usage()
RETURNS TRIGGER AS $$
DECLARE
    product_count INTEGER;
    project_count INTEGER;
    service_count INTEGER;
    entity_type_val TEXT;
BEGIN
    -- Get the entity type
    SELECT entity_type INTO entity_type_val
    FROM business_entities
    WHERE id = OLD.id;

    -- Check based on entity type
    IF entity_type_val = 'product' THEN
        SELECT COUNT(*) INTO product_count
        FROM products
        WHERE entity_id = OLD.id;
        
        IF product_count > 0 THEN
            RAISE EXCEPTION 'Cannot delete business entity as it is being used in products';
        END IF;
    ELSIF entity_type_val = 'project' THEN
        SELECT COUNT(*) INTO project_count
        FROM business_division_projects
        WHERE entity_id = OLD.id;
        
        IF project_count > 0 THEN
            RAISE EXCEPTION 'Cannot delete business entity as it is being used in projects';
        END IF;
    ELSIF entity_type_val = 'service' THEN
        SELECT COUNT(*) INTO service_count
        FROM services
        WHERE entity_id = OLD.id;
        
        IF service_count > 0 THEN
            RAISE EXCEPTION 'Cannot delete business entity as it is being used in services';
        END IF;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql; 