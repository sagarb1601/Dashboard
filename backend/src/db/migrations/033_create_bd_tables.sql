-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create business_entities table
CREATE TABLE IF NOT EXISTS business_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('product', 'project', 'service')),
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    payment_duration VARCHAR(50) CHECK (payment_duration IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects_bd table
CREATE TABLE IF NOT EXISTS projects_bd (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT service_entity_type CHECK (
        EXISTS (
            SELECT 1 FROM business_entities
            WHERE business_entities.id = services.entity_id
            AND business_entities.entity_type = 'service'
        )
    )
);

-- Create HPC services table
CREATE TABLE IF NOT EXISTS hpc_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE UNIQUE,
    num_cores INTEGER NOT NULL CHECK (num_cores > 0),
    billing_start_date DATE NOT NULL,
    billing_end_date DATE NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_hpc_dates CHECK (billing_end_date >= billing_start_date)
);

-- Create VAPT services table
CREATE TABLE IF NOT EXISTS vapt_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE UNIQUE,
    billing_start_date DATE NOT NULL,
    billing_end_date DATE NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_vapt_dates CHECK (billing_end_date >= billing_start_date)
);

-- Create Training services table
CREATE TABLE IF NOT EXISTS training_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE UNIQUE,
    training_on VARCHAR(255) NOT NULL,
    order_value DECIMAL(15,2) NOT NULL CHECK (order_value >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_training_dates CHECK (end_date >= start_date)
);

-- Create business_group_mappings table
CREATE TABLE IF NOT EXISTS business_group_mappings (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE CASCADE,
    contact_person_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_id, group_id)
);

-- Create purchase_orders_bd table
CREATE TABLE IF NOT EXISTS purchase_orders_bd (
    po_id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    invoice_no VARCHAR(255) NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_value DECIMAL(15,2) NOT NULL CHECK (invoice_value >= 0),
    payment_duration VARCHAR(50) CHECK (payment_duration IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time')),
    invoice_status VARCHAR(50) NOT NULL CHECK (invoice_status IN ('Pending', 'Approved', 'Rejected', 'Paid')),
    requested_by INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    payment_mode VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_business_entities_type ON business_entities(entity_type);
CREATE INDEX idx_business_entities_client ON business_entities(client_id);
CREATE INDEX idx_purchase_orders_entity ON purchase_orders_bd(entity_id);
CREATE INDEX idx_business_group_mappings_entity ON business_group_mappings(entity_id); 