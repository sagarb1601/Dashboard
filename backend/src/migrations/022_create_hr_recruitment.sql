CREATE TABLE hr_recruitment (
    id SERIAL PRIMARY KEY,
    recruitment_mode TEXT NOT NULL CHECK (recruitment_mode IN ('ACTS', 'OFF_CAMPUS', 'OPEN_AD')),
    year INTEGER NOT NULL CHECK (year >= 2000),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    recruited_count INTEGER NOT NULL CHECK (recruited_count >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 