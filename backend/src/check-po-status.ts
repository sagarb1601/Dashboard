// import { Pool } from 'pg';
import 'dotenv/config';
import pool from './db';

// Remove: const pool = new Pool();

async function checkPOStatus() {
  try {
    console.log('Checking purchase order statuses...');
    
    const result = await pool.query('SELECT DISTINCT status FROM purchase_orders');
    console.log('Purchase order statuses:', result.rows);
    
    const allPOs = await pool.query('SELECT id, po_number, status FROM purchase_orders');
    console.log('All purchase orders:', allPOs.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

async function checkPurchaseOrdersSchema() {
  try {
    console.log('Checking purchase_orders_bd table schema...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders_bd' 
      ORDER BY ordinal_position
    `);
    console.log('purchase_orders_bd table schema:');
    console.log(result.rows);
    const dataResult = await pool.query('SELECT * FROM purchase_orders_bd LIMIT 3');
    console.log('\nSample purchase_orders_bd data:');
    console.log(dataResult.rows);
  } catch (error) {
    console.error('Error checking purchase_orders_bd schema:', error);
  } finally {
    await pool.end();
  }
}

checkPOStatus();
checkPurchaseOrdersSchema(); 