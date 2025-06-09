-- Create enum types for better data consistency
CREATE TYPE agreement_type AS ENUM ('MOU', 'MOA', 'IOA', 'NDA', 'SLA', 'Others');
CREATE TYPE agreement_category AS ENUM ('Academic training', 'R&D', 'Commercial', 'ToT', 'Service', 'Funded projects');
CREATE TYPE agreement_subtype AS ENUM ('Biparty', 'Triparty');
CREATE TYPE agreement_level AS ENUM ('National', 'International');
CREATE TYPE agreement_status AS ENUM ('Active', 'Completed', 'Terminated');
CREATE TYPE legacy_status AS ENUM ('Central govt', 'State govt', 'Academia', 'R&D', 'NGO', 'Private');

-- Create array of valid thematic areas
CREATE TABLE thematic_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO thematic_areas (name) VALUES 
    ('HPC'),
    ('Grid & Cloud Computing'),
    ('Multilingual/Heritage Computing'),
    ('Professional Electronics'),
    ('VLSI & Embedded System'),
    ('Software technologies including FOSS'),
    ('Cybersecurity and Cyberforensics'),
    ('Health Informatics'),
    ('Education and Training');

-- Create array of valid CDAC centres
CREATE TABLE cdac_centres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO cdac_centres (name) VALUES 
    ('New Delhi'),
    ('Bangalore'),
    ('Chennai'),
    ('Noida'),
    ('Kolkata'),
    ('Mumbai'),
    ('Patna'),
    ('Pune'),
    ('Silchar'),
    ('Trivandrum'),
    ('Hyderabad'),
    ('Mohali');

-- Create main agreements table
CREATE TABLE agreements (
    id SERIAL PRIMARY KEY,
    agreement_type agreement_type NOT NULL,
    agreement_category agreement_category NOT NULL,
    agreement_subtype agreement_subtype,
    duration_months INTEGER,
    title TEXT NOT NULL,
    thematic_area_ids INTEGER[] NOT NULL,
    cdac_centre_ids INTEGER[] NOT NULL,
    signing_agency TEXT NOT NULL,
    funding_source TEXT,
    total_value NUMERIC(15, 2),
    scope TEXT,
    profile TEXT,
    legacy_status legacy_status NOT NULL,
    signed_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    level agreement_level NOT NULL,
    objectives TEXT,
    spoc_id INTEGER REFERENCES hr_employees(employee_id),
    status agreement_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (
        signed_date <= start_date AND 
        start_date <= end_date
    )
);

-- Create a function to validate array references
CREATE OR REPLACE FUNCTION check_array_references()
RETURNS TRIGGER AS $$
DECLARE
    valid BOOLEAN;
BEGIN
    IF TG_ARGV[0] = 'thematic_areas' THEN
        SELECT NOT EXISTS (
            SELECT UNNEST(NEW.thematic_area_ids) AS id
            EXCEPT
            SELECT id FROM thematic_areas
        ) INTO valid;
    ELSIF TG_ARGV[0] = 'cdac_centres' THEN
        SELECT NOT EXISTS (
            SELECT UNNEST(NEW.cdac_centre_ids) AS id
            EXCEPT
            SELECT id FROM cdac_centres
        ) INTO valid;
    END IF;

    IF NOT valid THEN
        RAISE EXCEPTION 'Invalid reference in array for table %', TG_ARGV[0];
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to validate array references
CREATE TRIGGER validate_thematic_areas
    BEFORE INSERT OR UPDATE ON agreements
    FOR EACH ROW
    EXECUTE FUNCTION check_array_references('thematic_areas');

CREATE TRIGGER validate_cdac_centres
    BEFORE INSERT OR UPDATE ON agreements
    FOR EACH ROW
    EXECUTE FUNCTION check_array_references('cdac_centres');

-- Create table for tracking activities and status changes
CREATE TABLE agreement_activities (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER REFERENCES agreements(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'Status Change' or 'Activity Update'
    status agreement_status,
    description TEXT,
    created_by INTEGER REFERENCES hr_employees(employee_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_agreements_updated_at
    BEFORE UPDATE ON agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 