-- Drop existing type-specific tables
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS projects_bd CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS hpc_services CASCADE;
DROP TABLE IF EXISTS vapt_services CASCADE;
DROP TABLE IF EXISTS training_services CASCADE;

-- Create products table with proper structure
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL CHECK (price >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'eol')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create projects table with proper structure
CREATE TABLE IF NOT EXISTS projects_bd (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE SET NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    extended_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create services table with proper structure
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE SET NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('hpc', 'vapt', 'training')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create HPC services table
CREATE TABLE IF NOT EXISTS hpc_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    num_cores INTEGER NOT NULL CHECK (num_cores > 0),
    billing_start_date DATE NOT NULL,
    billing_end_date DATE NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time')),
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_hpc_dates CHECK (billing_end_date >= billing_start_date)
);

-- Create VAPT services table
CREATE TABLE IF NOT EXISTS vapt_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    billing_start_date DATE NOT NULL,
    billing_end_date DATE NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time', 'milestone')),
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_vapt_dates CHECK (billing_end_date >= billing_start_date)
);

-- Create Training services table
CREATE TABLE IF NOT EXISTS training_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    training_on VARCHAR(255) NOT NULL,
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_training_dates CHECK (end_date >= start_date)
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
    
    IF NEW.extended_date IS NOT NULL THEN
        IF NEW.extended_date < (
            SELECT end_date FROM business_entities WHERE id = NEW.entity_id
        ) THEN
            RAISE EXCEPTION 'Extended date must be after entity end date';
        END IF;
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

CREATE OR REPLACE FUNCTION validate_hpc_service_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM services
        WHERE id = NEW.service_id AND service_type = 'hpc'
    ) THEN
        RAISE EXCEPTION 'Invalid service type: must be hpc';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_vapt_service_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM services
        WHERE id = NEW.service_id AND service_type = 'vapt'
    ) THEN
        RAISE EXCEPTION 'Invalid service type: must be vapt';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_training_service_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM services
        WHERE id = NEW.service_id AND service_type = 'training'
    ) THEN
        RAISE EXCEPTION 'Invalid service type: must be training';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS tr_validate_product_entity_type ON products;
CREATE TRIGGER tr_validate_product_entity_type
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_entity_type();

DROP TRIGGER IF EXISTS tr_validate_project_entity_type ON projects_bd;
CREATE TRIGGER tr_validate_project_entity_type
    BEFORE INSERT OR UPDATE ON projects_bd
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_entity_type();

DROP TRIGGER IF EXISTS tr_validate_service_entity_type ON services;
CREATE TRIGGER tr_validate_service_entity_type
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION validate_service_entity_type();

DROP TRIGGER IF EXISTS tr_validate_hpc_service_type ON hpc_services;
CREATE TRIGGER tr_validate_hpc_service_type
    BEFORE INSERT OR UPDATE ON hpc_services
    FOR EACH ROW
    EXECUTE FUNCTION validate_hpc_service_type();

DROP TRIGGER IF EXISTS tr_validate_vapt_service_type ON vapt_services;
CREATE TRIGGER tr_validate_vapt_service_type
    BEFORE INSERT OR UPDATE ON vapt_services
    FOR EACH ROW
    EXECUTE FUNCTION validate_vapt_service_type();

DROP TRIGGER IF EXISTS tr_validate_training_service_type ON training_services;
CREATE TRIGGER tr_validate_training_service_type
    BEFORE INSERT OR UPDATE ON training_services
    FOR EACH ROW
    EXECUTE FUNCTION validate_training_service_type();

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
DROP TRIGGER IF EXISTS update_products_timestamp ON products;
CREATE TRIGGER update_products_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_projects_timestamp ON projects_bd;
CREATE TRIGGER update_projects_timestamp
    BEFORE UPDATE ON projects_bd
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_services_timestamp ON services;
CREATE TRIGGER update_services_timestamp
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_hpc_services_timestamp ON hpc_services;
CREATE TRIGGER update_hpc_services_timestamp
    BEFORE UPDATE ON hpc_services
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_vapt_services_timestamp ON vapt_services;
CREATE TRIGGER update_vapt_services_timestamp
    BEFORE UPDATE ON vapt_services
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_training_services_timestamp ON training_services;
CREATE TRIGGER update_training_services_timestamp
    BEFORE UPDATE ON training_services
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add indexes for better performance
CREATE INDEX idx_products_entity ON products(entity_id);
CREATE INDEX idx_products_group ON products(group_id);
CREATE INDEX idx_projects_entity ON projects_bd(entity_id);
CREATE INDEX idx_projects_group ON projects_bd(group_id);
CREATE INDEX idx_services_entity ON services(entity_id);
CREATE INDEX idx_services_group ON services(group_id);
CREATE INDEX idx_services_type ON services(service_type);
CREATE INDEX idx_hpc_services_dates ON hpc_services(billing_start_date, billing_end_date);
CREATE INDEX idx_vapt_services_dates ON vapt_services(billing_start_date, billing_end_date);
CREATE INDEX idx_training_services_dates ON training_services(start_date, end_date); 