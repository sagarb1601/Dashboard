import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

async function markMigrationComplete() {
  try {
    // Check if migration is already marked as complete
    const checkResult = await pool.query(
      'SELECT 1 FROM migration_history WHERE migration_name = $1',
      ['054_create_talks_table.sql']
    );

    if (checkResult.rows.length === 0) {
      // Mark migration as complete
      await pool.query(
        'INSERT INTO migration_history (migration_name) VALUES ($1)',
        ['054_create_talks_table.sql']
      );
      console.log('Successfully marked talks migration as complete');
    } else {
      console.log('Talks migration was already marked as complete');
    }
  } catch (error) {
    console.error('Error marking migration as complete:', error);
  } finally {
    await pool.end();
  }
}

markMigrationComplete(); 