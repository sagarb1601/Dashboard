import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: 'postgres',
  password: 'sagar123',
  host: 'localhost',
  port: 5432,
  database: 'dashboard'
});

async function checkConstraints() {
  const client = await pool.connect();
  try {
    console.log('\nChecking table structure and constraints...');
    
    // Check amc_contracts table structure
    const tableResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'amc_contracts'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nAMC Contracts Table Structure:');
    console.log(tableResult.rows);

    // Check constraints
    const constraintResult = await client.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'amc_contracts'
      ORDER BY tc.constraint_type;
    `);

    console.log('\nAMC Contracts Constraints:');
    console.log(constraintResult.rows);

    // Check if there are any rows in the table
    const rowCountResult = await client.query('SELECT COUNT(*) FROM amc_contracts');
    console.log('\nTotal rows in amc_contracts:', rowCountResult.rows[0].count);

    // First check the specific contract we're trying to delete
    console.log('\nChecking Contract ID 1:');
    const contractResult = await client.query('SELECT * FROM amc_contracts WHERE amccontract_id = 1');
    console.log('Contract details:', contractResult.rows[0]);

    // Check equipment details if equipment_id exists
    if (contractResult.rows[0]?.equipment_id) {
      console.log('\nChecking linked equipment:');
      const equipmentResult = await client.query(
        'SELECT * FROM admin_equipments WHERE equipment_id = $1',
        [contractResult.rows[0].equipment_id]
      );
      console.log('Equipment details:', equipmentResult.rows[0]);
    }

    // Check AMC provider details if amcprovider_id exists
    if (contractResult.rows[0]?.amcprovider_id) {
      console.log('\nChecking linked AMC provider:');
      const providerResult = await client.query(
        'SELECT * FROM amc_providers WHERE amcprovider_id = $1',
        [contractResult.rows[0].amcprovider_id]
      );
      console.log('Provider details:', providerResult.rows[0]);
    }

    // Check if there are any other tables referencing amc_contracts
    console.log('\nChecking for other tables referencing amc_contracts:');
    const referencingTablesQuery = `
      SELECT
        tc.table_schema, 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'amc_contracts';
    `;
    const referencingTables = await client.query(referencingTablesQuery);
    console.log('Tables referencing amc_contracts:', referencingTables.rows);

  } catch (error) {
    console.error('Error checking dependencies:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstraints().catch(console.error); 