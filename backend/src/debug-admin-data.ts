import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function debugAdminData() {
  try {
    console.log('=== DEBUGGING ADMIN DATA ===\n');

    // Check staff data
    console.log('1. STAFF DATA:');
    const staffResult = await pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'ACTIVE\' THEN 1 END) as active FROM admin_staff');
    console.log('Staff summary:', staffResult.rows[0]);
    
    const staffDetails = await pool.query('SELECT staff_id, name, department_id, status, gender FROM admin_staff LIMIT 5');
    console.log('Sample staff:', staffDetails.rows);

    // Check departments
    console.log('\n2. DEPARTMENTS:');
    const deptResult = await pool.query('SELECT * FROM admin_departments');
    console.log('Departments:', deptResult.rows);

    // Check contractors
    console.log('\n3. CONTRACTORS:');
    const contractorResult = await pool.query('SELECT COUNT(*) as total FROM admin_contractors');
    console.log('Contractors summary:', contractorResult.rows[0]);
    
    const contractorDetails = await pool.query('SELECT contractor_id, contractor_company_name, contact_person FROM admin_contractors LIMIT 5');
    console.log('Sample contractors:', contractorDetails.rows);

    // Check contractor mappings
    console.log('\n4. CONTRACTOR MAPPINGS:');
    const mappingResult = await pool.query(`
      SELECT 
        c.contractor_id,
        c.contractor_company_name,
        m.department_id,
        m.start_date,
        m.end_date,
        CASE WHEN m.end_date >= CURRENT_DATE THEN 'ACTIVE' ELSE 'INACTIVE' END as status
      FROM admin_contractors c
      LEFT JOIN admin_contractor_department_mapping m ON c.contractor_id = m.contractor_id
      LIMIT 5
    `);
    console.log('Contractor mappings:', mappingResult.rows);

    // Check vehicles
    console.log('\n5. VEHICLES:');
    const vehicleResult = await pool.query('SELECT COUNT(*) as total FROM transport_vehicles');
    console.log('Vehicles summary:', vehicleResult.rows[0]);
    
    const vehicleDetails = await pool.query('SELECT vehicle_id, company_name, model, registration_no FROM transport_vehicles LIMIT 5');
    console.log('Sample vehicles:', vehicleDetails.rows);

    // Check AMC data
    console.log('\n6. AMC DATA:');
    const amcResult = await pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'ACTIVE\' THEN 1 END) as active FROM amc_contracts');
    console.log('AMC summary:', amcResult.rows[0]);
    
    const amcDetails = await pool.query('SELECT amccontract_id, equipment_id, amcprovider_id, status FROM amc_contracts LIMIT 5');
    console.log('Sample AMC contracts:', amcDetails.rows);

    // Test the actual dashboard queries
    console.log('\n7. TESTING DASHBOARD QUERIES:');
    
    // Staff summary query
    const staffSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_staff
      FROM admin_staff
    `);
    console.log('Staff summary query result:', staffSummary.rows[0]);

    // Contractor summary query
    const contractorSummary = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.contractor_id) as total_contractors,
        COUNT(DISTINCT CASE 
          WHEN m.end_date >= CURRENT_DATE THEN c.contractor_id 
        END) as active_contractors
      FROM admin_contractors c
      LEFT JOIN admin_contractor_department_mapping m ON c.contractor_id = m.contractor_id
    `);
    console.log('Contractor summary query result:', contractorSummary.rows[0]);

    // Vehicle summary query
    const vehicleSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(*) as operational_vehicles
      FROM transport_vehicles
    `);
    console.log('Vehicle summary query result:', vehicleSummary.rows[0]);

    // AMC summary query
    const amcSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_amc_contracts,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_amc_contracts
      FROM amc_contracts
    `);
    console.log('AMC summary query result:', amcSummary.rows[0]);

  } catch (error) {
    console.error('Error debugging admin data:', error);
  } finally {
    await pool.end();
  }
}

debugAdminData(); 