-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'CONTRACTOR_EXPIRY', 'AMC_EXPIRY', 'VEHICLE_INSURANCE', 'VEHICLE_SERVICE'
    reference_id INTEGER NOT NULL, -- ID of the related item (contractor_id, amc_id, vehicle_id)
    reference_type VARCHAR(50) NOT NULL, -- 'CONTRACTOR', 'AMC', 'VEHICLE'
    message TEXT NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'READ', 'DISMISSED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    setting_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'CONTRACTOR_EXPIRY', 'AMC_EXPIRY', 'VEHICLE_INSURANCE', 'VEHICLE_SERVICE'
    days_before INTEGER NOT NULL DEFAULT 30, -- Number of days before expiry to notify
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default notification settings
INSERT INTO notification_settings (type, days_before) VALUES
    ('CONTRACTOR_EXPIRY', 30),
    ('AMC_EXPIRY', 30),
    ('VEHICLE_INSURANCE', 30),
    ('VEHICLE_SERVICE', 7);

-- Create index for faster queries
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_due_date ON notifications(due_date);
CREATE INDEX idx_notifications_type ON notifications(type); 