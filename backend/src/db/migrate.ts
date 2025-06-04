import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const pool = new Pool();

const migrations = [
  '001_create_migration_tracking.sql',
  '002_create_projects.sql',
  '003_create_users.sql',
  '004_fix_project_budget_fields.sql',
  '005_create_grant_received.sql',
  '006_enable_btree_gist.sql',
  '007_create_admin_contractors.sql',
  '007_1_add_contractor_mapping_constraint.sql',
  '009_add_unique_contractor_name.sql',
  '010_create_staff_tables.sql',
  '010_create_amc_tables.sql',
  '011_add_staff_gender.sql',
  '012_create_vehicle_tables.sql',
  '013_create_acts_course_table.sql',
  '014_fix_vehicle_foreign_keys.sql',
  '015_create_hr_tables.sql',
  '016_create_employee_services_tables.sql',
  '017_add_initial_designation.sql',
  '018_update_promotions_constraints.sql'
];

async function runMigration() {
  try {
    console.log('Starting migration process...');
    console.log('Database config:', {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER
    });

    // First ensure the migration_history table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of executed migrations
    const { rows: executedMigrations } = await pool.query(
      'SELECT migration_name FROM migration_history'
    );
    const executedMigrationNames = new Set(
      executedMigrations.map(row => row.migration_name)
    );

    // Read migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');
    
    for (const migrationFile of migrations) {
      if (executedMigrationNames.has(migrationFile)) {
        console.log(`Skipping already executed migration: ${migrationFile}`);
        continue;
      }

      try {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        await pool.query('BEGIN');
        await pool.query(migrationSql);
        await pool.query(
          'INSERT INTO migration_history (migration_name) VALUES ($1)',
          [migrationFile]
        );
        await pool.query('COMMIT');

        console.log(`Successfully executed migration: ${migrationFile}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        const error = err as Error;
        console.error(`Migration failed: ${error}`);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } catch (err) {
    const error = err as Error;
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration(); 