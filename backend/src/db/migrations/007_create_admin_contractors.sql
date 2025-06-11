-- Create admin_departments table
CREATE TABLE IF NOT EXISTS admin_departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined departments
INSERT INTO admin_departments (department_name) VALUES
    ('HouseKeeping'),
    ('Gardening'),
    ('STP'),
    ('Electrical'),
    ('Canteen'),
    ('Transport');

-- Create admin_contractors table
CREATE TABLE admin_contractors (
    contractor_id SERIAL PRIMARY KEY,
    contractor_company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_contractor_department_mapping table
CREATE TABLE admin_contractor_department_mapping (
    contract_id SERIAL PRIMARY KEY,
    contractor_id INTEGER REFERENCES admin_contractors(contractor_id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES admin_departments(department_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
); 