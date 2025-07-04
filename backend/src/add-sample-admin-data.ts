import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function addSampleAdminData() {
  try {
    console.log('Adding sample admin data...');

    // Add sample staff
    await pool.query(`
      INSERT INTO admin_staff (name, department_id, joining_date, status, gender) VALUES
      ('John Doe', 1, '2023-01-15', 'ACTIVE', 'MALE'),
      ('Jane Smith', 2, '2023-02-20', 'ACTIVE', 'FEMALE'),
      ('Mike Johnson', 3, '2023-03-10', 'ACTIVE', 'MALE'),
      ('Sarah Wilson', 4, '2023-04-05', 'ACTIVE', 'FEMALE'),
      ('David Brown', 5, '2023-05-12', 'ACTIVE', 'MALE'),
      ('Lisa Davis', 6, '2023-06-18', 'ACTIVE', 'FEMALE'),
      ('Tom Miller', 1, '2023-07-22', 'INACTIVE', 'MALE'),
      ('Emma Taylor', 2, '2023-08-30', 'ACTIVE', 'FEMALE')
      ON CONFLICT DO NOTHING;
    `);

    // Add sample contractors
    await pool.query(`
      INSERT INTO admin_contractors (contractor_company_name, contact_person, phone, email, address) VALUES
      ('CleanPro Services', 'Rajesh Kumar', '9876543210', 'rajesh@cleanpro.com', 'Mumbai, Maharashtra'),
      ('GreenGardens Ltd', 'Priya Sharma', '9876543211', 'priya@greengardens.com', 'Delhi, India'),
      ('TechMaintenance Co', 'Amit Patel', '9876543212', 'amit@techmaintenance.com', 'Bangalore, Karnataka'),
      ('PowerSolutions Inc', 'Neha Singh', '9876543213', 'neha@powersolutions.com', 'Chennai, Tamil Nadu'),
      ('FoodCatering Pro', 'Vikram Mehta', '9876543214', 'vikram@foodcatering.com', 'Hyderabad, Telangana'),
      ('TransportExpress', 'Anjali Verma', '9876543215', 'anjali@transportexpress.com', 'Pune, Maharashtra')
      ON CONFLICT DO NOTHING;
    `);

    // Add sample contractor mappings
    await pool.query(`
      INSERT INTO admin_contractor_department_mapping (contractor_id, department_id, start_date, end_date) VALUES
      (1, 1, '2023-01-01', '2024-12-31'),
      (2, 2, '2023-02-01', '2024-11-30'),
      (3, 3, '2023-03-01', '2024-10-31'),
      (4, 4, '2023-04-01', '2024-09-30'),
      (5, 5, '2023-05-01', '2024-08-31'),
      (6, 6, '2023-06-01', '2024-07-31')
      ON CONFLICT DO NOTHING;
    `);

    // Add sample vehicles
    await pool.query(`
      INSERT INTO transport_vehicles (company_name, model, registration_no) VALUES
      ('Toyota', 'Innova Crysta', 'MH12AB1234'),
      ('Mahindra', 'XUV500', 'MH12CD5678'),
      ('Honda', 'City', 'MH12EF9012'),
      ('Maruti', 'Swift', 'MH12GH3456'),
      ('Hyundai', 'i20', 'MH12IJ7890'),
      ('Tata', 'Nexon', 'MH12KL1234')
      ON CONFLICT DO NOTHING;
    `);

    // Add sample AMC providers
    await pool.query(`
      INSERT INTO amc_providers (amcprovider_name, contact_person_name, contact_number, email, address) VALUES
      ('AC Maintenance Pro', 'Ramesh Kumar', '9876543216', 'ramesh@acmaintenance.com', 'Mumbai, Maharashtra'),
      ('PrinterCare Services', 'Sita Devi', '9876543217', 'sita@printercare.com', 'Delhi, India'),
      ('WaterTech Solutions', 'Arun Singh', '9876543218', 'arun@watertech.com', 'Bangalore, Karnataka'),
      ('PowerCare Systems', 'Meera Patel', '9876543219', 'meera@powercare.com', 'Chennai, Tamil Nadu'),
      ('SecurityTech Ltd', 'Kiran Sharma', '9876543220', 'kiran@securitytech.com', 'Hyderabad, Telangana')
      ON CONFLICT DO NOTHING;
    `);

    // Add sample AMC contracts
    await pool.query(`
      INSERT INTO amc_contracts (equipment_id, amcprovider_id, start_date, end_date, amc_value, remarks, status) VALUES
      (1, 1, '2023-01-01', '2024-12-31', 50000.00, 'Annual AC maintenance contract', 'ACTIVE'),
      (2, 2, '2023-02-01', '2024-11-30', 30000.00, 'Printer maintenance and repair', 'ACTIVE'),
      (3, 3, '2023-03-01', '2024-10-31', 25000.00, 'Water purifier service contract', 'ACTIVE'),
      (4, 4, '2023-04-01', '2024-09-30', 75000.00, 'Diesel generator maintenance', 'ACTIVE'),
      (5, 4, '2023-05-01', '2024-08-31', 40000.00, 'UPS system maintenance', 'ACTIVE'),
      (6, 5, '2023-06-01', '2024-07-31', 60000.00, 'CCTV system maintenance', 'ACTIVE'),
      (7, 5, '2023-07-01', '2024-06-30', 35000.00, 'Fire alarm system service', 'INACTIVE'),
      (8, 1, '2023-08-01', '2024-05-31', 45000.00, 'Elevator maintenance contract', 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Sample admin data added successfully!');
    
    // Verify the data
    const staffCount = await pool.query('SELECT COUNT(*) FROM admin_staff');
    const contractorCount = await pool.query('SELECT COUNT(*) FROM admin_contractors');
    const vehicleCount = await pool.query('SELECT COUNT(*) FROM transport_vehicles');
    const amcCount = await pool.query('SELECT COUNT(*) FROM amc_contracts');
    
    console.log('Data verification:');
    console.log(`- Staff: ${staffCount.rows[0].count}`);
    console.log(`- Contractors: ${contractorCount.rows[0].count}`);
    console.log(`- Vehicles: ${vehicleCount.rows[0].count}`);
    console.log(`- AMC Contracts: ${amcCount.rows[0].count}`);

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await pool.end();
  }
}

addSampleAdminData(); 