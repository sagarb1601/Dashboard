import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Get Business Dashboard Summary
router.get('/summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/summary - Fetching business summary');

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM business_entities) as total_entities,
        (SELECT COUNT(*) FROM purchase_orders_bd) as total_purchase_orders,
        (SELECT COALESCE(SUM(order_value), 0) FROM business_entities) as total_order_value,
        (SELECT COALESCE(SUM(invoice_value), 0) FROM purchase_orders_bd) as total_invoice_value,
        (SELECT COALESCE(SUM(amount), 0) FROM entity_payments WHERE status = 'received') as total_payments_received
    `);

    const summary = {
      total_clients: parseInt(result.rows[0]?.total_clients || '0'),
      total_entities: parseInt(result.rows[0]?.total_entities || '0'),
      total_purchase_orders: parseInt(result.rows[0]?.total_purchase_orders || '0'),
      total_order_value: parseFloat(result.rows[0]?.total_order_value || '0'),
      total_invoice_value: parseFloat(result.rows[0]?.total_invoice_value || '0'),
      total_payments_received: parseFloat(result.rows[0]?.total_payments_received || '0')
    };

    console.log('Business summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching business summary:', error);
    res.status(500).json({ error: 'Failed to fetch business summary' });
  }
});

// Get Business Entities per Month
router.get('/entities-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/entities-per-month - Fetching entities per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as entity_count
      FROM business_entities
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      entity_count: parseInt(row.entity_count)
    }));

    console.log('Entities per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching entities per month:', error);
    res.status(500).json({ error: 'Failed to fetch entities per month' });
  }
});

// Get Purchase Orders per Month
router.get('/purchase-orders-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/purchase-orders-per-month - Fetching purchase orders per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as po_count
      FROM purchase_orders_bd
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
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

// Get Invoice Value per Month
router.get('/invoice-value-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/invoice-value-per-month - Fetching invoice value per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COALESCE(SUM(invoice_value), 0) as total_invoice_value
      FROM purchase_orders_bd
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      total_invoice_value: parseFloat(row.total_invoice_value)
    }));

    console.log('Invoice value per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching invoice value per month:', error);
    res.status(500).json({ error: 'Failed to fetch invoice value per month' });
  }
});

// Get Payments per Month
router.get('/payments-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/payments-per-month - Fetching payments per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', payment_date), 'Mon YYYY') as month,
        COALESCE(SUM(amount), 0) as total_payment_amount
      FROM entity_payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months'
      AND status = 'received'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY DATE_TRUNC('month', payment_date)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      total_payment_amount: parseFloat(row.total_payment_amount)
    }));

    console.log('Payments per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching payments per month:', error);
    res.status(500).json({ error: 'Failed to fetch payments per month' });
  }
});

// Get Business Entities by Type
router.get('/entities-by-type', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/entities-by-type - Fetching entities by type');

    const result = await pool.query(`
      SELECT 
        entity_type,
        COUNT(*) as entity_count
      FROM business_entities
      GROUP BY entity_type
      ORDER BY entity_count DESC
    `);

    const data = result.rows.map(row => ({
      entity_type: row.entity_type,
      entity_count: parseInt(row.entity_count)
    }));

    console.log('Entities by type:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching entities by type:', error);
    res.status(500).json({ error: 'Failed to fetch entities by type' });
  }
});

// Get Purchase Orders by Status
router.get('/purchase-orders-by-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/purchase-orders-by-status - Fetching purchase orders by status');

    const result = await pool.query(`
      SELECT 
        invoice_status,
        COUNT(*) as po_count
      FROM purchase_orders_bd
      GROUP BY invoice_status
      ORDER BY po_count DESC
    `);

    const data = result.rows.map(row => ({
      invoice_status: row.invoice_status,
      po_count: parseInt(row.po_count)
    }));

    console.log('Purchase orders by status:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching purchase orders by status:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders by status' });
  }
});

// Get Revenue by Entity Type
router.get('/revenue-by-entity-type', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/revenue-by-entity-type - Fetching revenue by entity type');

    const result = await pool.query(`
      SELECT 
        be.entity_type,
        COALESCE(SUM(be.order_value), 0) as total_revenue
      FROM business_entities be
      GROUP BY be.entity_type
      ORDER BY total_revenue DESC
    `);

    const data = result.rows.map(row => ({
      entity_type: row.entity_type,
      total_revenue: parseFloat(row.total_revenue)
    }));

    console.log('Revenue by entity type:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching revenue by entity type:', error);
    res.status(500).json({ error: 'Failed to fetch revenue by entity type' });
  }
});

// Get Top Clients by Order Value
router.get('/top-clients-by-order-value', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /business/dashboard/top-clients-by-order-value - Fetching top clients by order value');

    const result = await pool.query(`
      SELECT 
        c.client_name,
        COALESCE(SUM(be.order_value), 0) as total_order_value
      FROM clients c
      LEFT JOIN business_entities be ON c.id = be.client_id
      GROUP BY c.id, c.client_name
      HAVING COALESCE(SUM(be.order_value), 0) > 0
      ORDER BY total_order_value DESC
      LIMIT 10
    `);

    const data = result.rows.map(row => ({
      client_name: row.client_name,
      total_order_value: parseFloat(row.total_order_value)
    }));

    console.log('Top clients by order value:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching top clients by order value:', error);
    res.status(500).json({ error: 'Failed to fetch top clients by order value' });
  }
});

export default router; 