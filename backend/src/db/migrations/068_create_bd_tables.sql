-- Create BD module tables
-- Migration 068: Create all BD tables with proper structure

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    "Contact No" VARCHAR(10),  
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_client_name UNIQUE (client_name)
);

-- Create business_entities table
CREATE TABLE IF NOT EXISTS business_entities (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('project', 'product', 'service')),
    name VARCHAR(255) NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    start_date DATE,
    end_date DATE,
    order_value DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Create projects_bd table
CREATE TABLE IF NOT EXISTS projects_bd (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER UNIQUE REFERENCES business_entities(id) ON DELETE CASCADE,
    extended_date DATE
);

-- Create products_bd table
CREATE TABLE IF NOT EXISTS products_bd (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER UNIQUE REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create services_bd table
CREATE TABLE IF NOT EXISTS services_bd (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER UNIQUE REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create training_services table
CREATE TABLE IF NOT EXISTS training_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services_bd(id) ON DELETE CASCADE,
    training_on VARCHAR(255),
    start_date DATE,
    end_date DATE,
    CONSTRAINT check_training_dates CHECK (end_date >= start_date)
);

-- Create hpc_services table
CREATE TABLE IF NOT EXISTS hpc_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services_bd(id) ON DELETE CASCADE,
    num_cores INTEGER,
    billing_start_date DATE,
    billing_end_date DATE,
    CONSTRAINT check_hpc_dates CHECK (billing_end_date >= billing_start_date)
);

-- Create vapt_services table
CREATE TABLE IF NOT EXISTS vapt_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services_bd(id) ON DELETE CASCADE,
    billing_start_date DATE,
    billing_end_date DATE,
    CONSTRAINT check_vapt_dates CHECK (billing_end_date >= billing_start_date)
);

-- Create entity_payments table
CREATE TABLE IF NOT EXISTS entity_payments (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    po_id INTEGER REFERENCES purchase_orders_bd(po_id) ON DELETE SET NULL,
    payment_date DATE,
    amount DECIMAL(15,2),
    payment_mode VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('received', 'pending')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_business_entities_client') THEN
        CREATE INDEX idx_business_entities_client ON business_entities(client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_business_entities_type') THEN
        CREATE INDEX idx_business_entities_type ON business_entities(entity_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_bd_entity') THEN
        CREATE INDEX idx_projects_bd_entity ON projects_bd(entity_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_bd_entity') THEN
        CREATE INDEX idx_products_bd_entity ON products_bd(entity_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_bd_entity') THEN
        CREATE INDEX idx_services_bd_entity ON services_bd(entity_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_training_services_service') THEN
        CREATE INDEX idx_training_services_service ON training_services(service_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_hpc_services_service') THEN
        CREATE INDEX idx_hpc_services_service ON hpc_services(service_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vapt_services_service') THEN
        CREATE INDEX idx_vapt_services_service ON vapt_services(service_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entity_payments_entity') THEN
        CREATE INDEX idx_entity_payments_entity ON entity_payments(entity_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entity_payments_po') THEN
        CREATE INDEX idx_entity_payments_po ON entity_payments(po_id);
    END IF;
END $$; 