-- Create staff table
CREATE TABLE admin_staff (
    staff_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES admin_departments(department_id) ON DELETE RESTRICT,
    joining_date DATE NOT NULL,
    date_of_leaving DATE,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_leaving_date CHECK (date_of_leaving IS NULL OR date_of_leaving >= joining_date)
);

-- Create staff salaries table with only net salary
CREATE TABLE admin_staff_salaries (
    salary_id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES admin_staff(staff_id) ON DELETE CASCADE,
    net_salary DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PAID', 'PENDING')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_staff_department ON admin_staff(department_id);
CREATE INDEX idx_staff_status ON admin_staff(status);
CREATE INDEX idx_salary_staff ON admin_staff_salaries(staff_id);
CREATE INDEX idx_salary_payment_date ON admin_staff_salaries(payment_date);
CREATE INDEX idx_salary_status ON admin_staff_salaries(status); 