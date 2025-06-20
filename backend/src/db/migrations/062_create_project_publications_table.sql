-- Create project_publications table with proper structure and constraints
BEGIN;

-- Drop the existing table if it exists (to recreate with proper constraints)
DROP TABLE IF EXISTS project_publications CASCADE;

-- Create project_publications table
CREATE TABLE project_publications (
    publication_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Journal', 'Conference', 'Workshop', 'Book Chapter', 'Technical Report')),
    title VARCHAR(500) NOT NULL,
    details TEXT NOT NULL,
    publication_date DATE NOT NULL,
    authors TEXT NOT NULL,
    doi VARCHAR(255),
    group_id INTEGER REFERENCES technical_groups(group_id),
    publication_scope VARCHAR(20) CHECK (publication_scope IN ('National', 'International')),
    impact_factor DECIMAL(5,3),
    internal_authors INTEGER[],
    external_authors TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_project_publications_project_id ON project_publications(project_id);
CREATE INDEX idx_project_publications_type ON project_publications(type);
CREATE INDEX idx_project_publications_publication_date ON project_publications(publication_date);
CREATE INDEX idx_project_publications_group_id ON project_publications(group_id);
CREATE INDEX idx_project_publications_scope ON project_publications(publication_scope);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_publications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_publications_updated_at
    BEFORE UPDATE ON project_publications
    FOR EACH ROW
    EXECUTE FUNCTION update_project_publications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE project_publications IS 'Stores project publications including journals, conferences, workshops, etc.';
COMMENT ON COLUMN project_publications.publication_id IS 'Unique identifier for each publication';
COMMENT ON COLUMN project_publications.project_id IS 'Reference to the finance_projects table';
COMMENT ON COLUMN project_publications.type IS 'Type of publication (Journal, Conference, Workshop, Book Chapter, Technical Report)';
COMMENT ON COLUMN project_publications.title IS 'Title of the publication';
COMMENT ON COLUMN project_publications.details IS 'Details about the publication (journal name, conference name, etc.)';
COMMENT ON COLUMN project_publications.publication_date IS 'Date when the publication was published';
COMMENT ON COLUMN project_publications.authors IS 'Comma-separated list of all authors (internal and external)';
COMMENT ON COLUMN project_publications.doi IS 'Digital Object Identifier for the publication';
COMMENT ON COLUMN project_publications.group_id IS 'Reference to technical_groups table';
COMMENT ON COLUMN project_publications.publication_scope IS 'National or International publication';
COMMENT ON COLUMN project_publications.impact_factor IS 'Journal impact factor or conference rank';
COMMENT ON COLUMN project_publications.internal_authors IS 'Array of employee IDs from hr_employees table';
COMMENT ON COLUMN project_publications.external_authors IS 'Array of external author names and affiliations';
COMMENT ON COLUMN project_publications.created_at IS 'Timestamp when the publication record was created';
COMMENT ON COLUMN project_publications.updated_at IS 'Timestamp when the publication record was last updated';

COMMIT; 