import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

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
  '018_update_promotions_constraints.sql',
  '021_update_training_fields.sql',
  '022_create_manpower_table.sql',
  '027_create_bd_tables.sql',
  '031_fix_products_table.sql',
  '032_update_bd_tables.sql',
  '033_create_bd_tables.sql',
  '034_alter_bd_tables.sql',
  '035_fix_business_entities.sql',
  '036_fix_group_mappings.sql',
  '037_fix_purchase_orders.sql',
  '039_fix_entity_redundancy.sql',
  '040_fix_services_constraint.sql',
  '041_rename_bd_projects.sql',
  '050_simplify_technical_status.sql',
  '051_fix_technical_status_constraint.sql',
  '052_add_technical_group_to_finance_projects.sql'
];

export async function runMigrations(pool: Pool) {
  try {
    // First ensure the migration_history table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // First, check if any migrations need to be rolled back
    const executedMigrations = await pool.query(
      'SELECT migration_name FROM migration_history ORDER BY executed_at DESC'
    );

    // Roll back migrations that are no longer in the list
    for (const row of executedMigrations.rows) {
      if (!migrations.includes(row.migration_name)) {
        console.log(`Rolling back migration: ${row.migration_name}`);
        await pool.query(
          'DELETE FROM migration_history WHERE migration_name = $1',
          [row.migration_name]
        );
      }
    }

    // Then run migrations in order
    for (const migration of migrations) {
      try {
        // Check if migration has already been executed
        const migrationCheck = await pool.query(
          'SELECT 1 FROM migration_history WHERE migration_name = $1',
          [migration]
        );

        if (migrationCheck.rows.length === 0) {
          console.log(`Running migration: ${migration}`);
          const sql = fs.readFileSync(path.join(__dirname, migration), 'utf8');
          await pool.query(sql);
          
          // Record the migration
          await pool.query(
            'INSERT INTO migration_history (migration_name) VALUES ($1)',
            [migration]
          );
          
          console.log(`Successfully executed migration: ${migration}`);
        } else {
          console.log(`Skipping already executed migration: ${migration}`);
        }
      } catch (error) {
        console.error(`Error executing migration ${migration}:`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
} 