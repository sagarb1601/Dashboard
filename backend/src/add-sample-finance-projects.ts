import pool from './db';

async function addSampleFinanceProjects() {
  try {
    console.log('Adding sample finance projects for technical dashboard...');

    // Add sample finance projects with IDs 1-6
    await pool.query(`
      INSERT INTO finance_projects (project_id, project_name, start_date, end_date, total_value, funding_agency, duration_years, group_id)
      VALUES 
        (1, 'AI Research Project', '2024-01-01', '2024-12-31', 1000000, 'DST', 1, 1),
        (2, 'Cloud Infrastructure Development', '2024-02-01', '2024-11-30', 1500000, 'MeitY', 1, 2),
        (3, 'Blockchain Innovation', '2023-11-01', '2024-10-31', 800000, 'DBT', 1, 3),
        (4, 'IoT Platform Development', '2024-03-01', '2025-02-28', 1200000, 'ISRO', 1, 4),
        (5, 'Machine Learning Framework', '2024-01-01', '2024-12-31', 900000, 'ICMR', 1, 5),
        (6, 'Cybersecurity Enhancement', '2024-02-01', '2024-11-30', 1100000, 'DRDO', 1, 6)
      ON CONFLICT (project_id) DO NOTHING
    `);

    console.log('Sample finance projects added successfully!');
  } catch (error) {
    console.error('Error adding sample finance projects:', error);
  } finally {
    await pool.end();
  }
}

addSampleFinanceProjects(); 