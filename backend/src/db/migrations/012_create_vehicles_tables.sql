-- Create transport vehicles table
CREATE TABLE transport_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration_no VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle servicing table
CREATE TABLE vehicle_servicing (
    service_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES transport_vehicles(vehicle_id),
    service_date DATE NOT NULL,
    next_service_date DATE NOT NULL,
    service_description TEXT NOT NULL,
    servicing_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT service_dates_check CHECK (next_service_date > service_date),
    CONSTRAINT no_service_overlap EXCLUDE USING gist (
        vehicle_id WITH =,
        daterange(service_date, next_service_date, '[]') WITH &&
    )
);

-- Create vehicle insurance table
CREATE TABLE vehicle_insurance (
    insurance_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES transport_vehicles(vehicle_id),
    insurance_provider VARCHAR(100) NOT NULL,
    policy_number VARCHAR(50) NOT NULL UNIQUE,
    insurance_start_date DATE NOT NULL,
    insurance_end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT insurance_dates_check CHECK (insurance_end_date > insurance_start_date),
    CONSTRAINT no_insurance_overlap EXCLUDE USING gist (
        vehicle_id WITH =,
        daterange(insurance_start_date, insurance_end_date, '[]') WITH &&
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_vehicle_servicing_dates ON vehicle_servicing (vehicle_id, service_date, next_service_date);
CREATE INDEX idx_vehicle_insurance_dates ON vehicle_insurance (vehicle_id, insurance_start_date, insurance_end_date);
CREATE INDEX idx_insurance_policy_number ON vehicle_insurance (policy_number); 