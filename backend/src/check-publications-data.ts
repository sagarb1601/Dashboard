import pool from './db';

async function checkPublicationsData() {
  try {
    console.log('Checking publications data...');

    // Check total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total_count FROM project_publications;
    `);
    console.log('Total publications:', countResult.rows[0].total_count);

    // Check sample data
    const sampleData = await pool.query(`
      SELECT * FROM project_publications LIMIT 5;
    `);
    console.log('Sample publications data:', JSON.stringify(sampleData.rows, null, 2));

    // Check publications by type
    const typeResult = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM project_publications
      GROUP BY type
      ORDER BY count DESC;
    `);
    console.log('Publications by type:', typeResult.rows);

    // Check if there are any publications with valid project_id references
    const validRefs = await pool.query(`
      SELECT COUNT(*) as valid_count 
      FROM project_publications pp
      JOIN finance_projects fp ON pp.project_id = fp.project_id;
    `);
    console.log('Publications with valid project references:', validRefs.rows[0].valid_count);

    // Check publications without valid references
    const invalidRefs = await pool.query(`
      SELECT COUNT(*) as invalid_count 
      FROM project_publications pp
      LEFT JOIN finance_projects fp ON pp.project_id = fp.project_id
      WHERE fp.project_id IS NULL;
    `);
    console.log('Publications without valid project references:', invalidRefs.rows[0].invalid_count);

  } catch (error) {
    console.error('Error checking publications data:', error);
  } finally {
    await pool.end();
  }
}

checkPublicationsData(); 