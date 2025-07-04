import express from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// Get all purchase orders
router.get('/', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool as Pool;

  try {
    const result = await pool.query(`
      SELECT 
        po.id as po_id,
        po.entity_id,
        po.invoice_no,
        po.invoice_date,
        po.invoice_value,
        po.payment_duration,
        po.status,
        po.requested_by,
        po.payment_mode,
        po.remarks,
        be.name as entity_name,
        be.type as entity_type,
        be.order_value,
        c.client_name,
        u.username as requested_by_name
      FROM purchase_orders_bd po
      LEFT JOIN business_entities be ON po.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      LEFT JOIN users u ON po.requested_by = u.id
      ORDER BY po.invoice_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get PO status history
router.get('/:poId/status-history', authenticateToken, async (req, res) => {
  const { poId } = req.params;
  const pool = req.app.locals.pool as Pool;

  try {
    const result = await pool.query(`
      SELECT 
        psh.id,
        psh.old_status,
        psh.new_status,
        psh.changed_at,
        psh.reason,
        u.username as changed_by
      FROM po_status_history psh
      LEFT JOIN users u ON psh.changed_by = u.id
      WHERE psh.po_id = $1
      ORDER BY psh.changed_at ASC
    `, [poId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching PO status history:', error);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
});

// Update PO status
router.put('/:poId/status', authenticateToken, async (req, res) => {
  const { poId } = req.params;
  const { new_status, reason, status_change_date } = req.body;
  const userId = (req as any).user.id;
  const pool = req.app.locals.pool as Pool;

  try {
    // Get current status
    const currentStatusResult = await pool.query(
      'SELECT status FROM purchase_orders_bd WHERE id = $1',
      [poId]
    );

    if (currentStatusResult.rows.length === 0) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    const oldStatus = currentStatusResult.rows[0].status;

    // Update PO status
    await pool.query(
      'UPDATE purchase_orders_bd SET status = $1 WHERE id = $2',
      [new_status, poId]
    );

    // Record status change in history with custom date
    await pool.query(`
      INSERT INTO po_status_history (po_id, old_status, new_status, changed_by, reason, changed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [poId, oldStatus, new_status, userId, reason, status_change_date || new Date()]);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Auto-update PO status based on payments
router.post('/:poId/auto-update-status', authenticateToken, async (req, res) => {
  const { poId } = req.params;
  const pool = req.app.locals.pool as Pool;

  try {
    // Get PO details
    const poResult = await pool.query(
      'SELECT * FROM purchase_orders_bd WHERE id = $1',
      [poId]
    );

    if (poResult.rows.length === 0) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    const po = poResult.rows[0];

    // Get total payments received
    const paymentsResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_received
      FROM entity_payments 
      WHERE po_id = $1 AND status = 'received'
    `, [poId]);

    const totalReceived = parseFloat(paymentsResult.rows[0].total_received);
    const invoiceValue = parseFloat(po.invoice_value);

    // Determine new status
    let newStatus = po.status;
    if (totalReceived === 0) {
      newStatus = 'Payment Pending';
    } else if (totalReceived < invoiceValue) {
      newStatus = 'Partial Payment';
    } else if (totalReceived >= invoiceValue) {
      newStatus = 'Paid Completely';
    }

    // Update status if changed
    if (newStatus !== po.status) {
      await pool.query(
        'UPDATE purchase_orders_bd SET status = $1 WHERE id = $2',
        [newStatus, poId]
      );

      // Record status change
      await pool.query(`
        INSERT INTO po_status_history (po_id, old_status, new_status, changed_by, reason)
        VALUES ($1, $2, $3, $4, $5)
      `, [poId, po.status, newStatus, (req as any).user.id, 'Auto-updated based on payment milestones']);

      res.json({ 
        message: 'Status auto-updated successfully',
        old_status: po.status,
        new_status: newStatus
      });
    } else {
      res.json({ 
        message: 'Status unchanged',
        current_status: po.status
      });
    }
  } catch (error) {
    console.error('Error auto-updating PO status:', error);
    res.status(500).json({ error: 'Failed to auto-update status' });
  }
});

export default router; 