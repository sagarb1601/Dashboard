-- First drop the dependent tables to avoid circular references
DROP TABLE IF EXISTS training_services CASCADE;
DROP TABLE IF EXISTS hpc_services CASCADE;
DROP TABLE IF EXISTS vapt_services CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS business_division_projects CASCADE;

-- Recreate products table without CASCADE
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'eol')),
    specifications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_entity UNIQUE (entity_id)
);

-- Recreate projects table without CASCADE
CREATE TABLE IF NOT EXISTS business_division_projects (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
    extended_date DATE,
    milestones JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_entity UNIQUE (entity_id)
);

-- Recreate services table without CASCADE
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE RESTRICT,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('hpc', 'vapt', 'training')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
    service_specific_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_service_entity UNIQUE (entity_id)
);

-- Create validation triggers
CREATE OR REPLACE FUNCTION validate_product_entity_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM business_entities
        WHERE id = NEW.entity_id AND entity_type = 'product'
    ) THEN
        RAISE EXCEPTION 'Invalid entity type: must be product';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_project_entity_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM business_entities
        WHERE id = NEW.entity_id AND entity_type = 'project'
    ) THEN
        RAISE EXCEPTION 'Invalid entity type: must be project';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_service_entity_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM business_entities
        WHERE id = NEW.entity_id AND entity_type = 'service'
    ) THEN
        RAISE EXCEPTION 'Invalid entity type: must be service';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS validate_product_entity_type ON products;
CREATE TRIGGER validate_product_entity_type
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_entity_type();

DROP TRIGGER IF EXISTS validate_project_entity_type ON business_division_projects;
CREATE TRIGGER validate_project_entity_type
    BEFORE INSERT OR UPDATE ON business_division_projects
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_entity_type();

DROP TRIGGER IF EXISTS validate_service_entity_type ON services;
CREATE TRIGGER validate_service_entity_type
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION validate_service_entity_type();

-- Update the business entity deletion check
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

-- Add the trigger to business_entities
DROP TRIGGER IF EXISTS check_business_entity_usage_trigger ON business_entities;
CREATE TRIGGER check_business_entity_usage_trigger
    BEFORE DELETE ON business_entities
    FOR EACH ROW
    EXECUTE FUNCTION check_business_entity_usage(); 