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
  '052_create_calendar_events.sql',
  '053_add_event_type_to_calendar_events.sql',
  '013_create_travels_table.sql',
  '054_create_talks_table.sql',
  '055_add_ed_attendance_to_calendar_events.sql',
  '056_add_attendance_status_constraint.sql',
  '057_create_patents_proposals.sql',
  '058_remove_patent_submission_columns.sql',
  '059_update_patent_status_history.sql',
  '060_update_proposals_table.sql',
  '062_create_project_publications_table.sql',
  '063_create_project_events_table.sql',
  '064_create_agreements_table.sql',
  '065_create_business_group_mappings.sql',
  '066_create_purchase_orders_bd.sql',
  '067_create_sla_fund_details.sql',
  '068_create_bd_tables.sql',
  '069_update_cascade_trigger.sql',
  '070_fix_business_entity_cascade.sql',
  '071_fix_entity_payments_check.sql',
  '072_remove_business_entity_trigger.sql',
  '073_require_po_for_payments.sql',
  '074_add_start_end_dates_to_purchase_orders.sql',
  '075_revert_purchase_orders_to_original.sql',
  '076_update_services_tables.sql',
  '078_add_service_type_and_billing_dates.sql',
  '079_create_po_status_history_fixed.sql'
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