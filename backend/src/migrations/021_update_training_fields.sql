-- Update training table to add new fields
ALTER TABLE hr_training
DROP COLUMN training_date,
DROP COLUMN guest_profile,
ADD COLUMN start_date DATE NOT NULL,
ADD COLUMN end_date DATE NOT NULL,
ADD COLUMN guest_lecture_name VARCHAR(255) NOT NULL,
ADD COLUMN lecturer_details TEXT NOT NULL; 