import pool from './db';

async function checkTechnicalProjectsSchema() {
  try {
    console.log('Checking technical_projects table schema and data...');

    // Check table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'technical_projects'
      ORDER BY ordinal_position;
    `);
    console.log('technical_projects columns:', columnsResult.rows);

    // Check if data exists
    const countResult = await pool.query(`
      SELECT COUNT(*) as total_count FROM technical_projects;
    `);
    console.log('Total technical projects:', countResult.rows[0].total_count);

    // Check sample data
    const sampleData = await pool.query(`
      SELECT * FROM technical_projects LIMIT 3;
    `);
    console.log('Sample technical projects data:', sampleData.rows);

    // Check if status field exists and what values it has
    const statusResult = await pool.query(`
      SELECT DISTINCT status FROM technical_projects;
    `);
    console.log('Available status values:', statusResult.rows);

  } catch (error) {
    console.error('Error checking technical_projects:', error);
  } finally {
    await pool.end();
  }
}

checkTechnicalProjectsSchema(); 