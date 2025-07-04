import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Get MMG dashboard summary
router.get('/summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/summary - Fetching MMG summary');

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_procurements,
        COUNT(CASE WHEN status = 'Pending Approval' OR status = 'Open' THEN 1 END) as pending_approvals,
        COUNT(CASE WHEN sourcing_method IS NOT NULL THEN 1 END) as active_bids,
        (SELECT COUNT(*) FROM purchase_orders WHERE status = 'Payment Processed') as completed_pos
      FROM procurements
    `);

    const summary = {
      total_procurements: parseInt(result.rows[0]?.total_procurements || '0'),
      pending_approvals: parseInt(result.rows[0]?.pending_approvals || '0'),
      active_bids: parseInt(result.rows[0]?.active_bids || '0'),
      completed_pos: parseInt(result.rows[0]?.completed_pos || '0')
    };

    console.log('MMG summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching MMG summary:', error);
    res.status(500).json({ error: 'Failed to fetch MMG summary' });
  }
});

// Get procurements per month
router.get('/procurements-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/procurements-per-month - Fetching procurements per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as procurement_count
      FROM procurements
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      procurement_count: parseInt(row.procurement_count)
    }));

    console.log('Procurements per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching procurements per month:', error);
    res.status(500).json({ error: 'Failed to fetch procurements per month' });
  }
});

// Get bids per month
router.get('/bids-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/bids-per-month - Fetching bids per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', pb.created_at), 'Mon YYYY') as month,
        COUNT(*) as bid_count
      FROM procurement_bids pb
      JOIN procurements p ON pb.procurement_id = p.id
      WHERE pb.created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', pb.created_at)
      ORDER BY DATE_TRUNC('month', pb.created_at)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      bid_count: parseInt(row.bid_count)
    }));

    console.log('Bids per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching bids per month:', error);
    res.status(500).json({ error: 'Failed to fetch bids per month' });
  }
});

// Get purchase orders per month
router.get('/pos-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/pos-per-month - Fetching purchase orders per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', po_date), 'Mon YYYY') as month,
        COUNT(*) as po_count
      FROM purchase_orders
      WHERE po_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', po_date)
      ORDER BY DATE_TRUNC('month', po_date)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      po_count: parseInt(row.po_count)
    }));

    console.log('Purchase orders per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching purchase orders per month:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders per month' });
  }
});

// Get procurement by type distribution
router.get('/procurement-by-type', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/procurement-by-type - Fetching procurement by type');

    const result = await pool.query(`
      SELECT 
        purchase_type,
        COUNT(*) as procurement_count,
        COALESCE(SUM(estimated_cost), 0) as total_value
      FROM procurements
      GROUP BY purchase_type
      ORDER BY procurement_count DESC
    `);

    const data = result.rows.map(row => ({
      purchase_type: row.purchase_type,
      procurement_count: parseInt(row.procurement_count),
      total_value: parseFloat(row.total_value)
    }));

    console.log('Procurement by type:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching procurement by type:', error);
    res.status(500).json({ error: 'Failed to fetch procurement by type' });
  }
});

// Get sourcing method distribution
router.get('/sourcing-method-distribution', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/sourcing-method-distribution - Fetching sourcing method distribution');

    const result = await pool.query(`
      SELECT 
        sourcing_method,
        COUNT(*) as procurement_count
      FROM procurements
      GROUP BY sourcing_method
      ORDER BY procurement_count DESC
    `);

    const data = result.rows.map(row => ({
      sourcing_method: row.sourcing_method,
      procurement_count: parseInt(row.procurement_count)
    }));

    console.log('Sourcing method distribution:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching sourcing method distribution:', error);
    res.status(500).json({ error: 'Failed to fetch sourcing method distribution' });
  }
});

// Get delivery place distribution
router.get('/delivery-place-distribution', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/delivery-place-distribution - Fetching delivery place distribution');

    const result = await pool.query(`
      SELECT 
        delivery_place,
        COUNT(*) as procurement_count
      FROM procurements
      GROUP BY delivery_place
      ORDER BY procurement_count DESC
    `);

    const data = result.rows.map(row => ({
      delivery_place: row.delivery_place,
      procurement_count: parseInt(row.procurement_count)
    }));

    console.log('Delivery place distribution:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching delivery place distribution:', error);
    res.status(500).json({ error: 'Failed to fetch delivery place distribution' });
  }
});

// Get procurement status distribution
router.get('/procurement-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /mmg/dashboard/procurement-status - Fetching procurement status');

    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as procurement_count
      FROM procurements
      GROUP BY status
      ORDER BY procurement_count DESC
    `);

    const data = result.rows.map(row => ({
      status: row.status,
      procurement_count: parseInt(row.procurement_count)
    }));

    console.log('Procurement status:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching procurement status:', error);
    res.status(500).json({ error: 'Failed to fetch procurement status' });
  }
});

export default router; 