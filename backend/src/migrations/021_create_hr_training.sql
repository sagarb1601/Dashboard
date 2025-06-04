CREATE TABLE hr_training (
    id SERIAL PRIMARY KEY,
    training_type TEXT NOT NULL CHECK (training_type IN ('TECHNICAL', 'MENTAL_HEALTH', 'SPECIAL_TECHNICAL_TRAINING', 'WORK_LIFE_BALANCE')),
    training_topic TEXT NOT NULL,
    training_date DATE NOT NULL,
    venue TEXT,
    attended_count INTEGER NOT NULL CHECK (attended_count >= 0),
    training_mode TEXT NOT NULL,
    guest_profile TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 