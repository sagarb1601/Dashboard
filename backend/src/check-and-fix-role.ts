import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: process.env.PGDATABASE || 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

async function checkAndFixRole() {
  try {
    // First check current role
    const checkResult = await pool.query('SELECT username, role FROM users WHERE username = $1', ['finance']);
    console.log('Current user data:', checkResult.rows[0]);

    // Update role to lowercase 'finance' if it's different
    await pool.query(
      'UPDATE users SET role = $1 WHERE username = $2',
      ['finance', 'finance']
    );

    // Verify the update
    const verifyResult = await pool.query('SELECT username, role FROM users WHERE username = $1', ['finance']);
    console.log('Updated user data:', verifyResult.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndFixRole(); 