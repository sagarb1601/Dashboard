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
    employee_id INTEGER PRIMARY KEY,
    employee_name TEXT NOT NULL,
    join_date DATE NOT NULL,
    leaving_date DATE,
    designation_id INTEGER REFERENCES hr_designations(designation_id) ON DELETE SET NULL,
    technical_group_id INTEGER REFERENCES technical_groups(group_id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    gender TEXT,
    level INTEGER,
    centre TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial designations
INSERT INTO hr_designations (designation, designation_full, level) VALUES
('PE', 'Project Engineer', 1),
('KA', 'Knowledge Associate', 1),
('SPE', 'Senior Project Engineer', 2),
('PA', 'Project Associate', 1);

-- Insert initial technical groups
INSERT INTO technical_groups (group_name, group_description) VALUES
('SOULWARE', 'Software Development Group'),
('VLSI', 'VLSI Design Group'),
('HPC', 'High Performance Computing Group'),
('SSP', 'System Software and Platform Group'),
('AI', 'Artificial Intelligence Group'),
('IoT', 'Internet of Things Group'); 