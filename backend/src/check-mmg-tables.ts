import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function checkMMGTables() {
  try {
    console.log('Checking MMG tables...');

    // Check procurements table
    console.log('\n=== PROCUREMENTS TABLE ===');
    const procurementsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'procurements' 
      ORDER BY ordinal_position;
    `);
    console.log('Procurements columns:', procurementsResult.rows);

    // Check procurement_bids table
    console.log('\n=== PROCUREMENT_BIDS TABLE ===');
    const bidsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'procurement_bids' 
      ORDER BY ordinal_position;
    `);
    console.log('Procurement_bids columns:', bidsResult.rows);

    // Check purchase_orders table
    console.log('\n=== PURCHASE_ORDERS TABLE ===');
    const posResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' 
      ORDER BY ordinal_position;
    `);
    console.log('Purchase_orders columns:', posResult.rows);

    // Check existing data
    console.log('\n=== EXISTING DATA ===');
    const procurementsCount = await pool.query('SELECT COUNT(*) FROM procurements');
    console.log('Procurements count:', procurementsCount.rows[0].count);

    const bidsCount = await pool.query('SELECT COUNT(*) FROM procurement_bids');
    console.log('Procurement_bids count:', bidsCount.rows[0].count);

    const posCount = await pool.query('SELECT COUNT(*) FROM purchase_orders');
    console.log('Purchase_orders count:', posCount.rows[0].count);

    // Check sample data if exists
    const sampleProcurements = await pool.query('SELECT * FROM procurements LIMIT 3');
    console.log('Sample procurements:', sampleProcurements.rows);

  } catch (error) {
    console.error('Error checking MMG tables:', error);
  } finally {
    await pool.end();
  }
}

checkMMGTables(); 