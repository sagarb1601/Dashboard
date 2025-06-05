-- Drop existing type-specific tables
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS projects_bd CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS hpc_services CASCADE;
DROP TABLE IF EXISTS vapt_services CASCADE;
DROP TABLE IF EXISTS training_services CASCADE;

-- Create products table with minimal non-redundant fields
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'eol')),
    specifications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE,
    CONSTRAINT unique_product_entity UNIQUE (entity_id)
);

-- Create projects table with minimal non-redundant fields
CREATE TABLE IF NOT EXISTS projects_bd (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
    extended_date DATE,
    milestones JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE,
    CONSTRAINT unique_project_entity UNIQUE (entity_id)
);

-- Create services table with minimal non-redundant fields
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('hpc', 'vapt', 'training')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
    service_specific_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE,
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

DROP TRIGGER IF EXISTS validate_project_entity_type ON projects_bd;
CREATE TRIGGER validate_project_entity_type
    BEFORE INSERT OR UPDATE ON projects_bd
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_entity_type();

DROP TRIGGER IF EXISTS validate_service_entity_type ON services;
CREATE TRIGGER validate_service_entity_type
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION validate_service_entity_type();

-- Add indexes for better performance
CREATE INDEX idx_products_entity ON products(entity_id);
CREATE INDEX idx_projects_entity ON projects_bd(entity_id);
CREATE INDEX idx_services_entity ON services(entity_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects_bd;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects_bd
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 