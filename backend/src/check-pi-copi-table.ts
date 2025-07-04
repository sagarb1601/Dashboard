import pool from './db';

async function checkPiCopiTable() {
  try {
    console.log('Checking for PI/Co-PI related tables...');

    // Check if pi_copi table exists
    const piCopiResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pi_copi'
      );
    `);
    console.log('pi_copi table exists:', piCopiResult.rows[0].exists);

    if (piCopiResult.rows[0].exists) {
      const piCopiColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'pi_copi'
        ORDER BY ordinal_position;
      `);
      console.log('pi_copi columns:', piCopiColumns.rows);

      // Check sample data
      const sampleData = await pool.query(`
        SELECT * FROM pi_copi LIMIT 5;
      `);
      console.log('Sample pi_copi data:', JSON.stringify(sampleData.rows, null, 2));
    }

    // Check all tables that might contain PI/Co-PI info
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%pi%' OR table_name LIKE '%copi%'
      ORDER BY table_name;
    `);
    console.log('Tables with PI/Co-PI in name:', allTables.rows);

    // Check if technical_projects has any additional columns we missed
    const allColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'technical_projects'
      ORDER BY ordinal_position;
    `);
    console.log('All technical_projects columns:', allColumns.rows.map(c => c.column_name));

  } catch (error) {
    console.error('Error checking PI/Co-PI tables:', error);
  } finally {
    await pool.end();
  }
}

checkPiCopiTable(); 