import pool from './db';

async function checkTechnicalTables() {
  try {
    console.log('Checking technical tables...');

    // Check if technical_projects table exists
    const projectsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'technical_projects'
      );
    `);
    console.log('technical_projects table exists:', projectsResult.rows[0].exists);

    if (projectsResult.rows[0].exists) {
      const projectsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'technical_projects'
        ORDER BY ordinal_position;
      `);
      console.log('technical_projects columns:', projectsColumns.rows);
    }

    // Check if project_publications table exists
    const publicationsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'project_publications'
      );
    `);
    console.log('project_publications table exists:', publicationsResult.rows[0].exists);

    if (publicationsResult.rows[0].exists) {
      const publicationsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'project_publications'
        ORDER BY ordinal_position;
      `);
      console.log('project_publications columns:', publicationsColumns.rows);
    }

    // Check if patents table exists
    const patentsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'patents'
      );
    `);
    console.log('patents table exists:', patentsResult.rows[0].exists);

    if (patentsResult.rows[0].exists) {
      const patentsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'patents'
        ORDER BY ordinal_position;
      `);
      console.log('patents columns:', patentsColumns.rows);
    }

    // Check if proposals table exists
    const proposalsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'proposals'
      );
    `);
    console.log('proposals table exists:', proposalsResult.rows[0].exists);

    if (proposalsResult.rows[0].exists) {
      const proposalsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'proposals'
        ORDER BY ordinal_position;
      `);
      console.log('proposals columns:', proposalsColumns.rows);
    }

  } catch (error) {
    console.error('Error checking technical tables:', error);
  } finally {
    await pool.end();
  }
}

checkTechnicalTables(); 