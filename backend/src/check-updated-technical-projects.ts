import pool from './db';

async function checkUpdatedTechnicalProjects() {
  try {
    console.log('Checking updated technical_projects table structure and data...');

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

    // Check sample data with all fields
    const sampleData = await pool.query(`
      SELECT * FROM technical_projects LIMIT 5;
    `);
    console.log('Sample technical projects data:', JSON.stringify(sampleData.rows, null, 2));

    // Check if status field exists now
    try {
      const statusResult = await pool.query(`
        SELECT DISTINCT status FROM technical_projects WHERE status IS NOT NULL;
      `);
      console.log('Available status values:', statusResult.rows);
    } catch (error) {
      console.log('Status field still does not exist');
    }

    // Check if project_type field exists now
    try {
      const typeResult = await pool.query(`
        SELECT DISTINCT project_type FROM technical_projects WHERE project_type IS NOT NULL;
      `);
      console.log('Available project_type values:', typeResult.rows);
    } catch (error) {
      console.log('Project_type field still does not exist');
    }

    // Check PI and Co-PI data
    try {
      const piResult = await pool.query(`
        SELECT DISTINCT pi_name FROM technical_projects WHERE pi_name IS NOT NULL;
      `);
      console.log('Available PI names:', piResult.rows);
    } catch (error) {
      console.log('PI field does not exist');
    }

    try {
      const copiResult = await pool.query(`
        SELECT DISTINCT co_pi_name FROM technical_projects WHERE co_pi_name IS NOT NULL;
      `);
      console.log('Available Co-PI names:', copiResult.rows);
    } catch (error) {
      console.log('Co-PI field does not exist');
    }

  } catch (error) {
    console.error('Error checking technical_projects:', error);
  } finally {
    await pool.end();
  }
}

checkUpdatedTechnicalProjects(); 