import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { pool } from '../../db/setup';

const router = express.Router();

// Get all procurements
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('MMG: GET /procurements endpoint called');
  console.log('MMG: User:', req.user);
  
  try {
    console.log('MMG: Executing database query...');
    const { rows } = await pool.query(`
      SELECT p.*, e.employee_name as created_by_name
      FROM procurements p
      LEFT JOIN hr_employees e ON p.indentor_id = e.employee_id
      ORDER BY p.created_at DESC
    `);
    console.log('MMG: Query successful, rows returned:', rows.length);
    console.log('MMG: First row sample:', rows[0]);
    res.json(rows);
  } catch (error) {
    console.error('MMG: Failed to get procurements:', error);
    console.error('MMG: Error details:', {
      message: (error as any).message,
      code: (error as any).code,
      detail: (error as any).detail
    });
    res.status(500).json({ message: 'Failed to get procurements', error: (error as any).message });
  }
});

// Create new procurement
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { 
    indent_number,
    title, 
    project_id, 
    group_id, 
    purchase_type, 
    delivery_place, 
    estimated_cost, 
    items, 
    indent_date,
    mmg_acceptance_date 
  } = req.body;
  const indentor_id = req.user?.employee_id;

  if (!indent_number || !title || !group_id || !purchase_type || !delivery_place || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'Missing required fields or items.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if indent number already exists
    const existingIndent = await client.query('SELECT id FROM procurements WHERE indent_number = $1', [indent_number]);
    if (existingIndent.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: 'Indent number already exists.' });
      return;
    }
    
    const procurementResult = await client.query(
      `INSERT INTO procurements (
        indent_number, title, project_id, indentor_id, group_id, purchase_type, 
        delivery_place, estimated_cost, status, indent_date, mmg_acceptance_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        indent_number, title, project_id, indentor_id, group_id, purchase_type, 
        delivery_place, estimated_cost, 'Indent Received', 
        indent_date ? new Date(indent_date) : new Date(),
        mmg_acceptance_date ? new Date(mmg_acceptance_date) : new Date()
      ]
    );
    const procurementId = procurementResult.rows[0].id;

    // Add initial history entry
    await client.query(
      'INSERT INTO procurement_history (procurement_id, old_status, new_status, remarks, status_date) VALUES ($1, $2, $3, $4, $5)', 
      [
        procurementId, 
        null, 
        'Indent Received', 
        `Indent created by user on ${new Date().toLocaleDateString()}`,
        new Date()
      ]
    );

    const itemPromises = items.map((item: any) => {
      return client.query('INSERT INTO procurement_items (procurement_id, item_name, quantity, specifications) VALUES ($1, $2, $3, $4)', 
        [procurementId, item.item_name, item.quantity, item.specifications]);
    });
    await Promise.all(itemPromises);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Procurement created successfully', procurementId, indent_number });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create procurement:', error);
    res.status(500).json({ message: 'Failed to create procurement' });
  } finally {
    client.release();
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const procurementResult = await pool.query('SELECT * FROM procurements WHERE id = $1', [id]);
    if (procurementResult.rows.length === 0) {
      res.status(404).json({ message: 'Procurement not found' });
      return;
    }
    const procurement = procurementResult.rows[0];
    
    const itemsResult = await pool.query('SELECT * FROM procurement_items WHERE procurement_id = $1', [id]);
    const historyResult = await pool.query(`
        SELECT h.*
        FROM procurement_history h 
        WHERE h.procurement_id = $1 
        ORDER BY h.status_date ASC
    `, [id]);
    
    res.json({ 
      ...procurement, 
      items: itemsResult.rows, 
      history: historyResult.rows 
    });
  } catch (error) {
    console.error(`Failed to get procurement ${id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve procurement details' });
  }
});

router.post('/:id/approve', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role, remarks, status } = req.body;
  const userId = req.user?.id;

  if (!role || !status || !['Approved', 'Rejected'].includes(status)) {
    res.status(400).json({ message: 'Invalid role or status provided.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get current status first
    const currentProcurement = await client.query('SELECT status FROM procurements WHERE id = $1', [id]);
    if (currentProcurement.rows.length === 0) {
      res.status(404).json({ message: 'Procurement not found' });
      return;
    }
    
    const oldStatus = currentProcurement.rows[0].status;
    let newStatus = '';
    
    if (status === 'Rejected') {
      newStatus = `Rejected by ${role}`;
    } else {
      if (role === 'Group Head') newStatus = 'Approved by Group Head';
      else if (role === 'Finance') newStatus = 'Approved by Finance';
      else if (role === 'ED') newStatus = 'Approved by ED';
      else {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Invalid role for approval.' });
        return;
      }
    }
    
    await client.query(
      'INSERT INTO procurement_history (procurement_id, old_status, new_status, remarks, status_date) VALUES ($1, $2, $3, $4, $5)', 
      [id, oldStatus, newStatus, remarks || `${status} by ${role}`, new Date()]
    );

    await client.query('UPDATE procurements SET status = $1 WHERE id = $2', [newStatus, id]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  } finally {
    client.release();
  }
});

// Add the missing status endpoint that frontend calls
router.post('/:id/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, remarks, status_date } = req.body;

  if (!status) {
    res.status(400).json({ message: 'Status is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get current status first
    const currentProcurement = await client.query('SELECT status FROM procurements WHERE id = $1', [id]);
    if (currentProcurement.rows.length === 0) {
      res.status(404).json({ message: 'Procurement not found' });
      return;
    }
    
    const oldStatus = currentProcurement.rows[0].status;
    
    // Only add to history if status is actually changing
    if (oldStatus !== status) {
      await client.query(
        'INSERT INTO procurement_history (procurement_id, old_status, new_status, remarks, status_date) VALUES ($1, $2, $3, $4, $5)', 
        [
          id, 
          oldStatus, 
          status, 
          remarks || `Status updated to ${status} by MMG user`,
          status_date ? new Date(status_date) : new Date()
        ]
      );
    }

    await client.query('UPDATE procurements SET status = $1 WHERE id = $2', [status, id]);

    // Get updated procurement data
    const procurementResult = await client.query('SELECT * FROM procurements WHERE id = $1', [id]);
    const itemsResult = await client.query('SELECT * FROM procurement_items WHERE procurement_id = $1', [id]);
    const historyResult = await pool.query(`
        SELECT h.*
        FROM procurement_history h 
        WHERE h.procurement_id = $1 
        ORDER BY h.status_date ASC
    `, [id]);

    await client.query('COMMIT');
    res.status(200).json({ 
      ...procurementResult.rows[0], 
      items: itemsResult.rows, 
      history: historyResult.rows 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  } finally {
    client.release();
  }
});

router.post('/:id/sourcing', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { sourcing_method, remarks } = req.body;
  const userId = req.user?.id;

  if (!sourcing_method || !['TENDER', 'GEM'].includes(sourcing_method)) {
    res.status(400).json({ message: 'Invalid sourcing method.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE procurements SET sourcing_method = $1 WHERE id = $2', [sourcing_method, id]);

    // Get current status first
    const currentProcurement = await client.query('SELECT status FROM procurements WHERE id = $1', [id]);
    const oldStatus = currentProcurement.rows[0].status;
    const newStatus = 'Sourcing Method Selected';
    
    await client.query(
      'INSERT INTO procurement_history (procurement_id, old_status, new_status, remarks, status_date) VALUES ($1, $2, $3, $4, $5)',
      [id, oldStatus, newStatus, remarks || `Sourcing method set to ${sourcing_method}`, new Date()]
    );
    
    await client.query('UPDATE procurements SET status = $1 WHERE id = $2', [newStatus, id]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Sourcing method updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update sourcing method:', error);
    res.status(500).json({ message: 'Failed to update sourcing method' });
  } finally {
    client.release();
  }
});

// Add the missing source endpoint that frontend calls
router.post('/:id/source', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { method } = req.body;

  if (!method || !['TENDER', 'GEM'].includes(method)) {
    res.status(400).json({ message: 'Invalid sourcing method.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE procurements SET sourcing_method = $1 WHERE id = $2', [method, id]);

    // Get current status first
    const currentProcurement = await client.query('SELECT status FROM procurements WHERE id = $1', [id]);
    const oldStatus = currentProcurement.rows[0].status;
    const newStatus = 'Sourcing Method Selected';
    
    await client.query(
      'INSERT INTO procurement_history (procurement_id, old_status, new_status, remarks, status_date) VALUES ($1, $2, $3, $4, $5)',
      [id, oldStatus, newStatus, `Sourcing method set to ${method} by MMG user`, new Date()]
    );
    
    await client.query('UPDATE procurements SET status = $1 WHERE id = $2', [newStatus, id]);

    // Get updated procurement data
    const procurementResult = await client.query('SELECT * FROM procurements WHERE id = $1', [id]);
    const itemsResult = await client.query('SELECT * FROM procurement_items WHERE procurement_id = $1', [id]);
    const historyResult = await pool.query(`
        SELECT h.*
        FROM procurement_history h 
        WHERE h.procurement_id = $1 
        ORDER BY h.status_date ASC
    `, [id]);

    await client.query('COMMIT');
    res.status(200).json({ 
      ...procurementResult.rows[0], 
      items: itemsResult.rows, 
      history: historyResult.rows 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update sourcing method:', error);
    res.status(500).json({ message: 'Failed to update sourcing method' });
  } finally {
    client.release();
  }
});

// Add bid to procurement
router.post('/:id/bids', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { vendor_name, bid_amount, number_of_bids, notes } = req.body;

  if (!vendor_name || !bid_amount) {
    res.status(400).json({ message: 'Vendor name and bid amount are required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if procurement exists and status allows adding bids
    const procurementResult = await client.query('SELECT status FROM procurements WHERE id = $1', [id]);
    if (procurementResult.rows.length === 0) {
      res.status(404).json({ message: 'Procurement not found' });
      return;
    }
    
    const procurement = procurementResult.rows[0];
    if (!['Order Placed in GeM', 'Tender Called', 'Bids Received'].includes(procurement.status)) {
      res.status(400).json({ message: 'Cannot add bids at current status.' });
      return;
    }
    
    // Add bid
    await client.query(
      'INSERT INTO procurement_bids (procurement_id, vendor_name, bid_amount, number_of_bids, notes) VALUES ($1, $2, $3, $4, $5)',
      [id, vendor_name, bid_amount, number_of_bids || 1, notes || null]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Bid added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to add bid:', error);
    res.status(500).json({ message: 'Failed to add bid' });
  } finally {
    client.release();
  }
});

// Get bids for a procurement
router.get('/:id/bids', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const bidsResult = await pool.query(
      'SELECT * FROM procurement_bids WHERE procurement_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(bidsResult.rows);
  } catch (error) {
    console.error('Failed to get bids:', error);
    res.status(500).json({ message: 'Failed to get bids' });
  }
});

// Finalize vendor from bids
router.post('/:id/finalize-vendor', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { bid_id, finalization_date } = req.body;

  if (!bid_id) {
    res.status(400).json({ message: 'Bid ID is required.' });
    return;
  }

  if (!finalization_date) {
    res.status(400).json({ message: 'Finalization date is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if procurement exists and has correct status
    const procurementResult = await client.query('SELECT status FROM procurements WHERE id = $1', [id]);
    if (procurementResult.rows.length === 0) {
      res.status(404).json({ message: 'Procurement not found' });
      return;
    }
    
    if (!['Bids Received', 'Tender Called'].includes(procurementResult.rows[0].status)) {
      res.status(400).json({ message: 'Cannot finalize vendor at current status.' });
      return;
    }
    
    // Get bid details
    const bidResult = await client.query('SELECT * FROM procurement_bids WHERE id = $1 AND procurement_id = $2', [bid_id, id]);
    if (bidResult.rows.length === 0) {
      res.status(404).json({ message: 'Bid not found' });
      return;
    }
    
    // Update procurement status to Vendor Finalized
    await client.query('UPDATE procurements SET status = $1 WHERE id = $2', ['Vendor Finalized', id]);
    
    // Add to history
    await client.query(
      'INSERT INTO procurement_history (procurement_id, old_status, new_status, remarks, status_date) VALUES ($1, $2, $3, $4, $5)',
      [id, procurementResult.rows[0].status, 'Vendor Finalized', `Vendor ${bidResult.rows[0].vendor_name} selected`, finalization_date]
    );
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'Vendor finalized successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to finalize vendor:', error);
    res.status(500).json({ message: 'Failed to finalize vendor' });
  } finally {
    client.release();
  }
});

// Create purchase order
router.post('/:id/purchase-order', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { po_number, po_date, po_value, po_creation_date } = req.body;

  if (!po_number || !po_date || !po_value || !po_creation_date) {
    res.status(400).json({ message: 'PO number, date, amount, and creation date are required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if procurement exists and has correct status
    const procurementResult = await client.query('SELECT status FROM procurements WHERE id = $1', [id]);
    if (procurementResult.rows.length === 0) {
      res.status(404).json({ message: 'Procurement not found' });
      return;
    }
    
    const procurement = procurementResult.rows[0];
    if (!['Vendor Finalized', 'Accepted by MMG'].includes(procurement.status)) {
      res.status(400).json({ message: 'Cannot create PO at current status.' });
      return;
    }
    
    // Get the selected bid to get vendor name
    const selectedBidResult = await client.query(
      'SELECT vendor_name FROM procurement_bids WHERE procurement_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    
    if (selectedBidResult.rows.length === 0) {
      res.status(400).json({ message: 'No vendor selected for this procurement.' });
      return;
    }
    
    const selectedVendor = selectedBidResult.rows[0].vendor_name;
    
    // Create purchase order
    const poResult = await client.query(
      'INSERT INTO purchase_orders (procurement_id, po_number, po_date, vendor_name, po_value, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [id, po_number, new Date(po_date), selectedVendor, po_value, 'Pending']
    );
    
    // Update procurement status
    await client.query('UPDATE procurements SET status = $1 WHERE id = $2', ['PO Created', id]);
    
    // Add to history
    await client.query(
      'INSERT INTO procurement_history (procurement_id, old_status, new_status, remarks, status_date) VALUES ($1, $2, $3, $4, $5)',
      [id, procurement.status, 'PO Created', `Purchase order ${po_number} created`, new Date(po_creation_date)]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Purchase order created successfully', po_id: poResult.rows[0].id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create purchase order:', error);
    res.status(500).json({ message: 'Failed to create purchase order' });
  } finally {
    client.release();
  }
});

// Update PO status (Pending -> Payment Processed)
router.put('/purchase-order/:po_id/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { po_id } = req.params;
  const { status, status_update_date, payment_completion_date } = req.body;

  if (!status || !['Pending', 'Payment Processed'].includes(status)) {
    res.status(400).json({ message: 'Invalid status provided.' });
    return;
  }

  if (!status_update_date) {
    res.status(400).json({ message: 'Status update date is required.' });
    return;
  }

  if (status === 'Payment Processed' && !payment_completion_date) {
    res.status(400).json({ message: 'Payment completion date is required when marking as Payment Processed.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update PO status
    if (status === 'Payment Processed') {
      await client.query(
        'UPDATE purchase_orders SET status = $1, payment_completion_date = $2 WHERE id = $3', 
        [status, new Date(payment_completion_date), po_id]
      );
    } else {
      await client.query('UPDATE purchase_orders SET status = $1 WHERE id = $2', [status, po_id]);
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'PO status updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update PO status:', error);
    res.status(500).json({ message: 'Failed to update PO status' });
  } finally {
    client.release();
  }
});

// Get purchase orders for a procurement
router.get('/:id/purchase-orders', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const poResult = await pool.query(
      'SELECT * FROM purchase_orders WHERE procurement_id = $1 ORDER BY po_date ASC',
      [id]
    );
    res.json(poResult.rows);
  } catch (error) {
    console.error('Failed to get purchase orders:', error);
    res.status(500).json({ message: 'Failed to get purchase orders' });
  }
});

// Delete procurement
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if procurement exists
    const procurementResult = await client.query('SELECT * FROM procurements WHERE id = $1', [id]);
    if (procurementResult.rows.length === 0) {
      res.status(404).json({ message: 'Procurement not found' });
      return;
    }

    const procurement = procurementResult.rows[0];
    
    // Only allow deletion if status is 'Pending Approval' or 'Rejected'
    if (!['Pending Approval', 'Rejected'].includes(procurement.status)) {
      res.status(400).json({ 
        message: 'Cannot delete procurement. Only pending or rejected procurements can be deleted.' 
      });
      return;
    }

    // Delete procurement (cascade will handle related records)
    await client.query('DELETE FROM procurements WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Procurement deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to delete procurement:', error);
    res.status(500).json({ message: 'Failed to delete procurement' });
  } finally {
    client.release();
  }
});

export default router; 