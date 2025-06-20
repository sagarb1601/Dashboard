const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

const pool = new Pool({
  user: 'postgres',
  password: 'sagar123',
  host: 'localhost',
  port: 5432,
  database: 'dashboard'
});

async function updateTriggerCascade() {
  const client = await pool.connect();
  try {
    console.log('🔄 Updating trigger function for cascade deletion...');
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'update-trigger-cascade.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✅ Trigger function updated for cascade deletion!');
    console.log('✅ Now when you delete a business entity:');
    console.log('   - It will automatically delete from products_bd');
    console.log('   - It will automatically delete from services_bd');
    console.log('   - It will automatically delete from projects_bd');
    console.log('   - It will prevent deletion if referenced in purchase_orders_bd or entity_payments');
    
  } catch (error) {
    console.error('Error updating trigger:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateTriggerCascade().catch(console.error); 