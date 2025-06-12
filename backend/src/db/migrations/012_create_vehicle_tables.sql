-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transport_vehicles table
CREATE TABLE IF NOT EXISTS transport_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle_servicing table
CREATE TABLE IF NOT EXISTS vehicle_servicing (
    service_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES transport_vehicles(vehicle_id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    next_service_date DATE NOT NULL,
    service_description TEXT NOT NULL,
    servicing_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle_insurance table
CREATE TABLE IF NOT EXISTS vehicle_insurance (
    insurance_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES transport_vehicles(vehicle_id) ON DELETE CASCADE,
    insurance_provider VARCHAR(100) NOT NULL,
    policy_number VARCHAR(50) NOT NULL UNIQUE,
    insurance_start_date DATE NOT NULL,
    insurance_end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_vehicle_servicing_vehicle_id ON vehicle_servicing(vehicle_id);
CREATE INDEX idx_vehicle_insurance_vehicle_id ON vehicle_insurance(vehicle_id);
CREATE INDEX idx_vehicle_servicing_dates ON vehicle_servicing(service_date, next_service_date);
CREATE INDEX idx_vehicle_insurance_dates ON vehicle_insurance(insurance_start_date, insurance_end_date); 