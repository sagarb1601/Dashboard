-- Create project_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_events (
    event_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    participants_count INTEGER,
    venue VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add project_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_events' 
        AND constraint_name = 'fk_project_events_project_id'
    ) THEN
        ALTER TABLE project_events 
        ADD CONSTRAINT fk_project_events_project_id 
        FOREIGN KEY (project_id) 
        REFERENCES finance_projects(project_id) 
        ON DELETE CASCADE;
    END IF;
    
    -- Add group_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_events' 
        AND constraint_name = 'fk_project_events_group_id'
    ) THEN
        ALTER TABLE project_events 
        ADD CONSTRAINT fk_project_events_group_id 
        FOREIGN KEY (group_id) 
        REFERENCES technical_groups(group_id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_group_id ON project_events(group_id);
CREATE INDEX IF NOT EXISTS idx_project_events_start_date ON project_events(start_date);

-- Add comments for documentation
COMMENT ON TABLE project_events IS 'Stores events related to technical projects';
COMMENT ON COLUMN project_events.event_id IS 'Unique identifier for the event';
COMMENT ON COLUMN project_events.project_id IS 'Reference to the finance_projects table';
COMMENT ON COLUMN project_events.group_id IS 'Reference to the technical_groups table';
COMMENT ON COLUMN project_events.event_type IS 'Type of event (e.g., workshop, seminar, conference)';
COMMENT ON COLUMN project_events.title IS 'Title/name of the event';
COMMENT ON COLUMN project_events.start_date IS 'Start date of the event';
COMMENT ON COLUMN project_events.end_date IS 'End date of the event (optional)';
COMMENT ON COLUMN project_events.participants_count IS 'Number of participants in the event';
COMMENT ON COLUMN project_events.venue IS 'Location/venue where the event takes place'; 