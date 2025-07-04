-- Add event_type column to calendar_events table
ALTER TABLE calendar_events
ADD COLUMN event_type VARCHAR(20) NOT NULL DEFAULT 'event'
CHECK (event_type IN ('event', 'training', 'meeting', 'other'));

-- Add comment for the new column
COMMENT ON COLUMN calendar_events.event_type IS 'Type of the event: event, training, meeting, or other';

-- Create index for faster queries on event_type
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type); 