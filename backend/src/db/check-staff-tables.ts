import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: process.env.PGDATABASE || 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

async function checkStaffTables() {
  try {
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_staff', 'admin_staff_salaries')
    `);
    
    console.log('Staff tables found:', tablesResult.rows.map(row => row.table_name));

    // Check admin_staff table columns
    const staffColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'admin_staff'
      ORDER BY ordinal_position;
    `);

    console.log('\nadmin_staff table structure:');
    staffColumns.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check admin_staff_salaries table columns
    const salariesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'admin_staff_salaries'
      ORDER BY ordinal_position;
    `);

    console.log('\nadmin_staff_salaries table structure:');
    salariesColumns.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('Error checking staff tables:', error);
  } finally {
    await pool.end();
  }
}

checkStaffTables(); 