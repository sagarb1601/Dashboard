-- Create HR tables
CREATE TABLE hr_designations (
    designation_id SERIAL PRIMARY KEY,
    designation VARCHAR(100) NOT NULL,
    designation_full VARCHAR(100),
    level INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE technical_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    group_description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr_employees (
    employee_id SERIAL PRIMARY KEY,
    employee_name TEXT NOT NULL,
    join_date DATE NOT NULL,
    leaving_date DATE,
    designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL,
    technical_group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    gender VARCHAR(2),
    level INTEGER,
    centre VARCHAR(2),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined designations
INSERT INTO hr_designations (designation, designation_full, level) VALUES
('PE', 'Project Engineer', 1),
('KA', 'Knowledge Associate', 1),
('SPE', 'Senior Project Engineer', 2),
('PA', 'Project Associate', 1);

-- Insert predefined technical groups
INSERT INTO technical_groups (group_name, group_description) VALUES
('SOULWARE', 'Software Development Group'),
('VLSI', 'Very Large Scale Integration Group'),
('HPC', 'High Performance Computing Group'),
('SSP', 'System Software and Platform Group'),
('AI', 'Artificial Intelligence Group'),
('IoT', 'Internet of Things Group'); 