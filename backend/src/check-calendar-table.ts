import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

async function checkCalendarTable() {
  try {
    // Check table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'calendar_events'
      ORDER BY ordinal_position;
    `);
    console.log('\nCalendar Events table structure:');
    console.table(structureResult.rows);

    // Check if the ED attendance columns exist
    const edColumns = structureResult.rows.filter(row => 
      row.column_name.startsWith('ed_attendance')
    );
    console.log('\nED Attendance columns:');
    console.table(edColumns);

    // Get sample data count
    const countResult = await pool.query('SELECT COUNT(*) FROM calendar_events');
    console.log('\nNumber of events in calendar_events table:', countResult.rows[0].count);

  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    await pool.end();
  }
}

checkCalendarTable(); 