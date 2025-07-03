import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function addSampleTrainingData() {
  try {
    console.log('Adding sample training data...');

    // Add sample training data
    await pool.query(`
      INSERT INTO hr_training (training_type, training_topic, start_date, end_date, guest_lecture_name, lecturer_details, attended_count, training_mode, venue) VALUES
      ('TECHNICAL', 'Advanced JavaScript Development', '2024-01-15', '2024-01-16', 'Dr. Rajesh Kumar', 'Senior Software Engineer with 10+ years experience', 25, 'ONLINE', 'Virtual Classroom'),
      ('MENTAL_HEALTH', 'Stress Management Workshop', '2024-02-20', '2024-02-20', 'Dr. Priya Sharma', 'Certified Mental Health Counselor', 30, 'OFFLINE', 'Conference Room A'),
      ('SPECIAL_TECHNICAL_TRAINING', 'Machine Learning Fundamentals', '2024-03-10', '2024-03-12', 'Prof. Amit Patel', 'AI Research Scientist', 20, 'HYBRID', 'Training Lab'),
      ('WORK_LIFE_BALANCE', 'Time Management Skills', '2024-04-05', '2024-04-05', 'Ms. Neha Singh', 'Life Coach and Productivity Expert', 35, 'ONLINE', 'Virtual Meeting'),
      ('TECHNICAL', 'React.js Best Practices', '2024-05-12', '2024-05-13', 'Mr. Vikram Mehta', 'Frontend Development Lead', 28, 'OFFLINE', 'Development Center'),
      ('MENTAL_HEALTH', 'Team Building Activities', '2024-06-18', '2024-06-18', 'Ms. Anjali Verma', 'HR Training Specialist', 40, 'OFFLINE', 'Outdoor Venue'),
      ('SPECIAL_TECHNICAL_TRAINING', 'Cloud Computing Basics', '2024-07-22', '2024-07-24', 'Mr. Ramesh Kumar', 'Cloud Solutions Architect', 22, 'HYBRID', 'Cloud Lab'),
      ('WORK_LIFE_BALANCE', 'Communication Skills', '2024-08-30', '2024-08-30', 'Dr. Sita Devi', 'Communication Expert', 32, 'ONLINE', 'Virtual Workshop')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Sample training data added successfully!');
  } catch (error) {
    console.error('Error adding sample training data:', error);
  } finally {
    await pool.end();
  }
}

addSampleTrainingData(); 