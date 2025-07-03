import pool from './db';

async function debugAdminDashboard() {
  try {
    console.log('=== DEBUGGING ADMIN DASHBOARD QUERIES ===\n');

    // Test staff summary
    console.log('1. STAFF SUMMARY:');
    const staffResult = await pool.query(`
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_staff
      FROM admin_staff
    `);
    console.log('Staff summary:', staffResult.rows[0]);

    // Test staff by department
    console.log('\n2. STAFF BY DEPARTMENT:');
    const staffDeptResult = await pool.query(`
      SELECT 
        d.department_name,
        COUNT(s.staff_id) as staff_count
      FROM admin_departments d
      LEFT JOIN admin_staff s ON d.department_id = s.department_id AND s.status = 'ACTIVE'
      GROUP BY d.department_id, d.department_name
      ORDER BY staff_count DESC
    `);
    console.log('Staff by department:', staffDeptResult.rows);

    // Test vehicle summary
    console.log('\n3. VEHICLE SUMMARY:');
    const vehicleResult = await pool.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(*) as operational_vehicles
      FROM transport_vehicles
    `);
    console.log('Vehicle summary:', vehicleResult.rows[0]);

    // Test vehicle status - FIXED QUERY
    console.log('\n4. VEHICLE STATUS (FIXED):');
    const vehicleStatusResult = await pool.query(`
      SELECT 
        'OPERATIONAL' as status,
        COUNT(*) as count
      FROM transport_vehicles
    `);
    console.log('Vehicle status:', vehicleStatusResult.rows);

    // Test contractor summary
    console.log('\n5. CONTRACTOR SUMMARY:');
    const contractorResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.contractor_id) as total_contractors,
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM admin_contractor_department_mapping m2 
            WHERE m2.contractor_id = c.contractor_id 
            AND m2.end_date >= CURRENT_DATE
          ) THEN c.contractor_id 
        END) as active_contractors
      FROM admin_contractors c
    `);
    console.log('Contractor summary:', contractorResult.rows[0]);

    // Test AMC summary
    console.log('\n6. AMC SUMMARY:');
    const amcResult = await pool.query(`
      SELECT 
        COUNT(*) as total_amc_contracts,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_amc_contracts
      FROM amc_contracts
    `);
    console.log('AMC summary:', amcResult.rows[0]);

    // Check if tables exist and have data
    console.log('\n7. TABLE DATA COUNTS:');
    const tables = ['admin_staff', 'admin_departments', 'transport_vehicles', 'admin_contractors', 'amc_contracts'];
    
    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`${table}: ERROR - ${error}`);
      }
    }

    // Check sample data
    console.log('\n8. SAMPLE DATA:');
    
    const sampleStaff = await pool.query('SELECT staff_id, name, department_id, status FROM admin_staff LIMIT 3');
    console.log('Sample staff:', sampleStaff.rows);
    
    const sampleDepts = await pool.query('SELECT department_id, department_name FROM admin_departments LIMIT 3');
    console.log('Sample departments:', sampleDepts.rows);
    
    const sampleVehicles = await pool.query('SELECT vehicle_id, company_name, model FROM transport_vehicles LIMIT 3');
    console.log('Sample vehicles:', sampleVehicles.rows);

  } catch (error) {
    console.error('Error in debug:', error);
  } finally {
    await pool.end();
  }
}

debugAdminDashboard(); 