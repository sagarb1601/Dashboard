import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function testMMGDashboard() {
  try {
    console.log('Testing MMG Dashboard queries...');

    // Test summary query
    console.log('\n=== SUMMARY QUERY ===');
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_procurements,
        COUNT(CASE WHEN status = 'Pending Approval' OR status = 'Open' THEN 1 END) as pending_approvals,
        COUNT(CASE WHEN sourcing_method IS NOT NULL THEN 1 END) as active_bids,
        (SELECT COUNT(*) FROM purchase_orders WHERE status = 'Payment Processed') as completed_pos
      FROM procurements
    `);
    console.log('Summary result:', summaryResult.rows[0]);

    // Test procurements per month
    console.log('\n=== PROCUREMENTS PER MONTH ===');
    const procurementsResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as procurement_count
      FROM procurements
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);
    console.log('Procurements per month:', procurementsResult.rows);

    // Test purchase orders per month
    console.log('\n=== PURCHASE ORDERS PER MONTH ===');
    const posResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', po_date), 'Mon YYYY') as month,
        COUNT(*) as po_count
      FROM purchase_orders
      WHERE po_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', po_date)
      ORDER BY DATE_TRUNC('month', po_date)
    `);
    console.log('Purchase orders per month:', posResult.rows);

    // Test procurement by type
    console.log('\n=== PROCUREMENT BY TYPE ===');
    const typeResult = await pool.query(`
      SELECT 
        purchase_type,
        COUNT(*) as procurement_count,
        COALESCE(SUM(estimated_cost), 0) as total_value
      FROM procurements
      GROUP BY purchase_type
      ORDER BY procurement_count DESC
    `);
    console.log('Procurement by type:', typeResult.rows);

    // Test procurement status
    console.log('\n=== PROCUREMENT STATUS ===');
    const statusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as procurement_count
      FROM procurements
      GROUP BY status
      ORDER BY procurement_count DESC
    `);
    console.log('Procurement status:', statusResult.rows);

    // Test delivery place distribution
    console.log('\n=== DELIVERY PLACE DISTRIBUTION ===');
    const deliveryResult = await pool.query(`
      SELECT 
        delivery_place,
        COUNT(*) as procurement_count
      FROM procurements
      GROUP BY delivery_place
      ORDER BY procurement_count DESC
    `);
    console.log('Delivery place distribution:', deliveryResult.rows);

  } catch (error) {
    console.error('Error testing MMG dashboard:', error);
  } finally {
    await pool.end();
  }
}

testMMGDashboard(); 