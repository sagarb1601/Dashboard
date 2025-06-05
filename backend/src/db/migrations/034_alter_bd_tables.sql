-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hpc_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    billing_start_date DATE,
    billing_end_date DATE,
    payment_type VARCHAR(50),
    order_value DECIMAL(15,2),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vapt_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    billing_start_date DATE,
    billing_end_date DATE,
    payment_type VARCHAR(50),
    order_value DECIMAL(15,2),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_services (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for timestamp updates
DROP TRIGGER IF EXISTS update_clients_timestamp ON clients;
CREATE TRIGGER update_clients_timestamp
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_business_entities_timestamp ON business_entities;
CREATE TRIGGER update_business_entities_timestamp
    BEFORE UPDATE ON business_entities
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
CREATE INDEX IF NOT EXISTS idx_clients_contact_number ON clients(contact_number);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);
CREATE INDEX IF NOT EXISTS idx_business_entities_dates ON business_entities(start_date, end_date);

-- Add constraints
ALTER TABLE business_entities
DROP CONSTRAINT IF EXISTS check_dates,
ADD CONSTRAINT check_dates CHECK (end_date >= start_date);

ALTER TABLE hpc_services
DROP CONSTRAINT IF EXISTS check_hpc_dates,
ADD CONSTRAINT check_hpc_dates CHECK (billing_end_date >= billing_start_date);

ALTER TABLE vapt_services
DROP CONSTRAINT IF EXISTS check_vapt_dates,
ADD CONSTRAINT check_vapt_dates CHECK (billing_end_date >= billing_start_date);

ALTER TABLE training_services
DROP CONSTRAINT IF EXISTS check_training_dates,
ADD CONSTRAINT check_training_dates CHECK (end_date >= start_date); 