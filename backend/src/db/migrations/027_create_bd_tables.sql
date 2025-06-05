-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_client_name UNIQUE (client_name)
);

-- Create business_entities table
CREATE TABLE IF NOT EXISTS business_entities (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('product', 'project', 'service')),
    name VARCHAR(255) NOT NULL,
    client_id INTEGER REFERENCES clients(id),
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
    entity_id INTEGER REFERENCES business_entities(id),
    extended_date DATE,
    CONSTRAINT fk_project_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id),
    CONSTRAINT fk_service_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id),
    CONSTRAINT fk_product_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create training_services table
CREATE TABLE IF NOT EXISTS training_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    training_on VARCHAR(255),
    order_value DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    CONSTRAINT fk_training_service FOREIGN KEY (service_id) 
        REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT check_training_dates CHECK (end_date >= start_date)
);

-- Create hpc_services table
CREATE TABLE IF NOT EXISTS hpc_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    num_cores INTEGER,
    billing_start_date DATE,
    start_date DATE,
    end_date DATE,
    CONSTRAINT fk_hpc_service FOREIGN KEY (service_id) 
        REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT check_hpc_dates CHECK (end_date >= start_date)
);

-- Create vapt_services table
CREATE TABLE IF NOT EXISTS vapt_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    start_date DATE,
    end_date DATE,
    CONSTRAINT fk_vapt_service FOREIGN KEY (service_id) 
        REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT check_vapt_dates CHECK (end_date >= start_date)
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders_bd (
    po_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('product', 'project', 'service')),
    entity_id INTEGER REFERENCES business_entities(id),
    invoice_no VARCHAR(100),
    invoice_date DATE,
    invoice_value DECIMAL(15,2),
    payment_duration VARCHAR(50), -- Monthly, Quarterly, etc.
    invoice_status VARCHAR(50) DEFAULT 'Pending',
    requested_by INTEGER REFERENCES hr_employees(employee_id),
    payment_mode VARCHAR(50), -- Milestone, T&C
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
);

-- Create business_group_mappings table
CREATE TABLE IF NOT EXISTS business_group_mappings (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id),
    group_id INTEGER REFERENCES technical_groups(group_id),
    contact_person_id INTEGER REFERENCES hr_employees(employee_id),
    role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mapping_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE,
    CONSTRAINT fk_mapping_group FOREIGN KEY (group_id) 
        REFERENCES technical_groups(group_id) ON DELETE CASCADE,
    CONSTRAINT fk_mapping_contact FOREIGN KEY (contact_person_id) 
        REFERENCES hr_employees(employee_id) ON DELETE SET NULL
); 