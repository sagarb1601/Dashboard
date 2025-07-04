import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function addSampleRecruitmentData() {
  try {
    console.log('Adding sample recruitment data...');

    // Add sample recruitment data
    await pool.query(`
      INSERT INTO hr_recruitment (recruitment_mode, year, month, recruited_count) VALUES
      ('ACTS', 2024, 1, 5),
      ('OFF_CAMPUS', 2024, 2, 3),
      ('OPEN_AD', 2024, 3, 8),
      ('ACTS', 2024, 4, 4),
      ('OFF_CAMPUS', 2024, 5, 6),
      ('OPEN_AD', 2024, 6, 10),
      ('ACTS', 2023, 12, 3),
      ('OFF_CAMPUS', 2023, 11, 2),
      ('OPEN_AD', 2023, 10, 7)
      ON CONFLICT DO NOTHING;
    `);

    console.log('Sample recruitment data added successfully!');
  } catch (error) {
    console.error('Error adding sample recruitment data:', error);
  } finally {
    await pool.end();
  }
}

addSampleRecruitmentData(); 