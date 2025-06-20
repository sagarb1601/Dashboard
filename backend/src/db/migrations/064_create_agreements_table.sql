-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id SERIAL PRIMARY KEY,
    agreement_type VARCHAR(100) NOT NULL,
    agreement_category VARCHAR(100) NOT NULL,
    agreement_subtype VARCHAR(100),
    duration_months INTEGER,
    title VARCHAR(500) NOT NULL,
    thematic_area_ids INTEGER[],
    cdac_centre_ids INTEGER[],
    signing_agency VARCHAR(255),
    funding_source VARCHAR(255),
    total_value DECIMAL(15,2),
    scope TEXT,
    profile TEXT,
    legacy_status VARCHAR(100),
    signed_date DATE,
    start_date DATE,
    end_date DATE,
    level VARCHAR(50),
    objectives TEXT,
    spoc_id INTEGER REFERENCES hr_employees(employee_id),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agreement_activities table
CREATE TABLE IF NOT EXISTS agreement_activities (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER REFERENCES agreements(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    status VARCHAR(50),
    description TEXT,
    created_by INTEGER REFERENCES hr_employees(employee_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_agreements_spoc_id ON agreements(spoc_id);
CREATE INDEX idx_agreements_status ON agreements(status);
CREATE INDEX idx_agreements_signed_date ON agreements(signed_date);
CREATE INDEX idx_agreement_activities_agreement_id ON agreement_activities(agreement_id);
CREATE INDEX idx_agreement_activities_created_by ON agreement_activities(created_by);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agreements table
CREATE TRIGGER trigger_update_agreements_timestamp
    BEFORE UPDATE ON agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_agreements_updated_at();

-- Add comments
COMMENT ON TABLE agreements IS 'Stores agreement information for business development';
COMMENT ON TABLE agreement_activities IS 'Stores activity history for agreements'; 