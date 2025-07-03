import express from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import procurementsRouter from './procurements';
import { pool } from '../../db/db';

const router = express.Router();

console.log('MMG Router: Loading MMG routes...');
console.log('MMG Router: procurementsRouter imported:', typeof procurementsRouter);

// Test route to verify MMG router is working
router.get('/test', authenticateToken, (req: AuthRequest, res) => {
  console.log('MMG Router: Test route accessed');
  res.json({ message: 'MMG router is working!', user: req.user });
});

// Combined MMG data endpoint
router.get('/combined-data', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('MMG Router: Fetching combined MMG data...');
    
    const query = `
      SELECT 
        p.id,
        p.indent_number,
        p.title,
        p.purchase_type,
        p.delivery_place,
        p.status as procurement_status,
        p.estimated_cost,
        p.indent_date,
        p.mmg_acceptance_date,
        p.sourcing_method,
        -- Group and Indentor information
        tg.group_name,
        he.employee_name as indentor_name,
        -- Bid information
        pb.vendor_name as bid_vendor,
        pb.bid_amount,
        pb.created_at as bid_date,
        pb.number_of_bids,
        -- Purchase Order information
        po.po_number,
        po.po_date,
        po.po_value,
        po.vendor_name as po_vendor,
        po.status as po_status,
        -- Payment information (simplified)
        CASE 
          WHEN po.status = 'Payment Processed' THEN 'Payment Processed'
          WHEN po.status = 'Pending' THEN 'Payment Pending'
          WHEN po.status IS NULL THEN 'No PO'
          ELSE po.status
        END as payment_status,
        NULL as payment_date,
        po.po_value as payment_amount
      FROM procurements p
      LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
      LEFT JOIN hr_employees he ON p.indentor_id = he.employee_id
      LEFT JOIN procurement_bids pb ON p.id = pb.procurement_id
      LEFT JOIN purchase_orders po ON p.id = po.procurement_id
      ORDER BY p.indent_date DESC, p.id DESC
    `;
    
    const result = await pool.query(query);
    console.log(`MMG Router: Found ${result.rows.length} combined records`);
    res.json(result.rows);
  } catch (error) {
    console.error('MMG Router: Error fetching combined data:', error);
    // Return empty array instead of 500 error to prevent global issues
    res.json([]);
  }
});

console.log('MMG Router: Registering procurements routes...');
router.use('/procurements', procurementsRouter);

console.log('MMG Router: MMG routes loaded successfully');

// We can add more routes here later using the same pattern.

export default router; 