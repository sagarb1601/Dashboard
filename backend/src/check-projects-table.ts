import pool from './db';

async function checkProjectsTable() {
  try {
    console.log('Checking projects table structure...');

    // Check if projects table exists
    const projectsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      );
    `);
    console.log('projects table exists:', projectsResult.rows[0].exists);

    if (projectsResult.rows[0].exists) {
      const projectsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'projects'
        ORDER BY ordinal_position;
      `);
      console.log('projects columns:', projectsColumns.rows);
    }

    // Check if finance_projects table exists
    const financeProjectsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'finance_projects'
      );
    `);
    console.log('finance_projects table exists:', financeProjectsResult.rows[0].exists);

    if (financeProjectsResult.rows[0].exists) {
      const financeProjectsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'finance_projects'
        ORDER BY ordinal_position;
      `);
      console.log('finance_projects columns:', financeProjectsColumns.rows);
    }

  } catch (error) {
    console.error('Error checking projects table:', error);
  } finally {
    await pool.end();
  }
}

checkProjectsTable(); 