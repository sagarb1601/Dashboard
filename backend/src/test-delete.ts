import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: 'postgres',
  password: 'sagar123',
  host: 'localhost',
  port: 5432,
  database: 'dashboard'
});

async function testDelete() {
  const client = await pool.connect();
  try {
    // First show all contracts
    console.log('\nListing all contracts:');
    const allContracts = await client.query('SELECT * FROM amc_contracts ORDER BY amccontract_id');
    console.log('Available contracts:', allContracts.rows);

    if (allContracts.rows.length === 0) {
      console.log('No contracts exist in the database');
      return;
    }

    // Ask which contract to delete
    console.log('\nContract IDs available:', allContracts.rows.map(c => c.amccontract_id));
    
    // For now, try to delete the first one
    const contractId = allContracts.rows[0].amccontract_id;
    console.log('\nAttempting to delete contract ID:', contractId);

    // Start transaction
    await client.query('BEGIN');
    
    // Set foreign keys to null
    console.log('Setting foreign keys to NULL...');
    await client.query(
      'UPDATE amc_contracts SET equipment_id = NULL, amcprovider_id = NULL WHERE amccontract_id = $1',
      [contractId]
    );

    // Delete the contract
    console.log('Deleting contract...');
    const deleteResult = await client.query(
      'DELETE FROM amc_contracts WHERE amccontract_id = $1 RETURNING *',
      [contractId]
    );
    
    await client.query('COMMIT');
    console.log('\nDelete successful:', deleteResult.rows[0]);

    // Show remaining contracts
    const remaining = await client.query('SELECT amccontract_id FROM amc_contracts ORDER BY amccontract_id');
    console.log('\nRemaining contract IDs:', remaining.rows.map(c => c.amccontract_id));

  } catch (error) {
    console.error('Error:', error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

testDelete().catch(console.error); 