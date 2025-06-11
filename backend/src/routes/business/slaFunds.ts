import { Router } from 'express';
import pool from '../../db';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Get all SLA fund details
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        sf.*,
        a.title as agreement_title
      FROM sla_fund_details sf
      JOIN agreements a ON sf.agreement_id = a.id
      ORDER BY sf.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching SLA fund details:', error);
    res.status(500).json({ error: 'Failed to fetch SLA fund details' });
  }
});

// Get SLA fund details by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        sf.*,
        a.title as agreement_title
      FROM sla_fund_details sf
      JOIN agreements a ON sf.agreement_id = a.id
      WHERE sf.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'SLA fund details not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching SLA fund detail:', error);
    res.status(500).json({ error: 'Failed to fetch SLA fund detail' });
  }
});

// Create new SLA fund detail
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      agreement_id,
      payment_type,
      amount,
      payment_status,
      comments
    } = req.body;

    const query = `
      INSERT INTO sla_fund_details (
        agreement_id,
        payment_type,
        amount,
        payment_status,
        comments
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      agreement_id,
      payment_type,
      amount,
      payment_status || 'pending',
      comments
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating SLA fund detail:', error);
    res.status(500).json({ error: 'Failed to create SLA fund detail' });
  }
});

// Update SLA fund detail
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      agreement_id,
      payment_type,
      amount,
      payment_status,
      comments
    } = req.body;

    const query = `
      UPDATE sla_fund_details SET
        agreement_id = $1,
        payment_type = $2,
        amount = $3,
        payment_status = $4,
        comments = $5
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [
      agreement_id,
      payment_type,
      amount,
      payment_status,
      comments,
      id
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'SLA fund detail not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating SLA fund detail:', error);
    res.status(500).json({ error: 'Failed to update SLA fund detail' });
  }
});

// Delete SLA fund detail
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM sla_fund_details WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'SLA fund detail not found' });
      return;
    }

    res.json({ message: 'SLA fund detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting SLA fund detail:', error);
    res.status(500).json({ error: 'Failed to delete SLA fund detail' });
  }
});

export default router; 