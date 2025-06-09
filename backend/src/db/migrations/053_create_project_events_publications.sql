-- Drop existing tables and indexes if they exist
DROP INDEX IF EXISTS idx_project_events_project;
DROP INDEX IF EXISTS idx_project_publications_project;
DROP TABLE IF EXISTS project_events;
DROP TABLE IF EXISTS project_publications;

-- Create project_events table
CREATE TABLE IF NOT EXISTS project_events (
    event_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    event_type VARCHAR(50) CHECK (event_type IN ('Workshop', 'Conference', 'Training')),
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    participants_count INTEGER,
    venue TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_event_dates CHECK (end_date >= start_date)
);

-- Create project_publications table
CREATE TABLE IF NOT EXISTS project_publications (
    publication_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('Journal', 'Publication')),
    title VARCHAR(255) NOT NULL,
    details TEXT,
    publication_date DATE NOT NULL,
    authors TEXT NOT NULL,
    doi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_project_events_project ON project_events(project_id);
CREATE INDEX idx_project_publications_project ON project_publications(project_id); 