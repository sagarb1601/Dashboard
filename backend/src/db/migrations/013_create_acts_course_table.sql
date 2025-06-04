-- Create acts_course table
CREATE TABLE acts_course (
    id SERIAL PRIMARY KEY,
    course_name TEXT NOT NULL,
    batch_name VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    students_enrolled INTEGER,
    students_placed INTEGER,
    course_fee NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_name, batch_id)
); 