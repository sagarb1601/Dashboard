import { Router, Request, Response, NextFunction } from 'express';
import pool from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

console.log('Proposals router is being loaded...');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Simple test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Proposals router is working!' });
});

// Get all proposals for a group
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    try {
      console.log('GET /proposals - Request user:', authReq.user);
      
      // Check if user exists and has tg role
      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        console.log('User not found or not a technical group user');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      // Get group_id by matching username with technical group name
      console.log('Attempting to match username:', authReq.user.username, 'with technical groups');
      const groupResult = await pool.query(
        'SELECT group_id, group_name FROM technical_groups WHERE LOWER(group_name) = LOWER($1)',
        [authReq.user.username]
      );
      console.log('Group match result:', groupResult.rows);

      const group_id = groupResult.rows[0]?.group_id;
      if (!group_id) {
        console.log('No matching technical group found');
        return res.status(404).json({ error: 'Technical group not found' });
      }

      // Get proposals with employee names, group name, and status history
      const result = await pool.query(
        `SELECT 
          p.*,
          e.employee_name as submitted_by_name,
          tg.group_name,
          (
            SELECT json_agg(jsonb_build_object(
              'history_id', h.history_id,
              'old_status', h.old_status,
              'new_status', h.new_status,
              'remarks', h.remarks,
              'update_date', to_char(h.update_date, 'YYYY-MM-DD')
            ) ORDER BY h.update_date DESC)
            FROM proposal_status_history h
            WHERE h.proposal_id = p.proposal_id
          ) as status_history
         FROM proposals p
         LEFT JOIN hr_employees e ON p.submitted_by = e.employee_id
         LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
         WHERE p.group_id = $1
         ORDER BY p.submission_date DESC`,
        [group_id]
      );

      console.log('Proposals query result:', result.rows.length, 'rows');
      res.json(result.rows);
    } catch (error) {
      console.error('Error in proposals route:', error);
      next(error);
    }
  })();
});

// Get available employees for the group
router.get('/employees', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    try {
      console.log('GET /employees - Request user:', authReq.user);
      
      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        console.log('User not authorized:', authReq.user?.role);
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      // First get the group_id
      const groupResult = await pool.query(
        'SELECT group_id FROM technical_groups WHERE LOWER(group_name) = LOWER($1)',
        [authReq.user.username]
      );
      
      console.log('Group query result:', groupResult.rows);
      
      if (groupResult.rows.length === 0) {
        console.log('No technical group found for user:', authReq.user.username);
        return res.status(404).json({ error: 'Technical group not found' });
      }

      const group_id = groupResult.rows[0].group_id;

      // Then get all active employees in this group
      const result = await pool.query(
        `SELECT e.employee_id, e.employee_name
         FROM hr_employees e
         WHERE e.technical_group_id = $1
         AND e.status = 'active'
         ORDER BY e.employee_name`,
        [group_id]
      );

      console.log('Employees query result:', result.rows.length, 'employees found');
      res.json(result.rows);
    } catch (error) {
      console.error('Error in /employees endpoint:', error);
      next(error);
    }
  })();
});

// Create a new proposal
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        throw new Error('Unauthorized access');
      }

      // Get group_id
      const groupResult = await client.query(
        'SELECT group_id FROM technical_groups WHERE LOWER(group_name) = LOWER($1)',
        [authReq.user.username]
      );

      const group_id = groupResult.rows[0]?.group_id;
      if (!group_id) {
        throw new Error('Technical group not found');
      }

      const {
        proposal_title,
        submitted_by,
        submission_date,
        funding_agency,
        proposed_budget,
        status,
        remarks,
        approval_date,
        rejection_date,
        rejection_reason
      } = req.body;

      // Validate required fields
      if (!proposal_title || !submitted_by || !submission_date || !funding_agency || !proposed_budget) {
        throw new Error('Missing required fields');
      }

      // Convert empty strings to null for optional fields
      const remarksValue = remarks === '' ? null : remarks;
      const approvalDateValue = approval_date === '' ? null : approval_date;
      const rejectionDateValue = rejection_date === '' ? null : rejection_date;
      const rejectionReasonValue = rejection_reason === '' ? null : rejection_reason;

      // Insert proposal
      const result = await client.query(
        `INSERT INTO proposals (
          proposal_title,
          submitted_by,
          submission_date,
          funding_agency,
          proposed_budget,
          status,
          remarks,
          approval_date,
          rejection_date,
          rejection_reason,
          group_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING proposal_id`,
        [
          proposal_title,
          submitted_by,
          submission_date,
          funding_agency,
          proposed_budget,
          status || 'Draft',
          remarksValue,
          approvalDateValue,
          rejectionDateValue,
          rejectionReasonValue,
          group_id
        ]
      );

      await client.query('COMMIT');

      // Fetch the complete proposal data
      const completeProposal = await pool.query(
        `SELECT 
          p.*,
          e.employee_name as submitted_by_name,
          tg.group_name
         FROM proposals p
         LEFT JOIN hr_employees e ON p.submitted_by = e.employee_id
         LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
         WHERE p.proposal_id = $1`,
        [result.rows[0].proposal_id]
      );

      res.status(201).json(completeProposal.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating proposal:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    } finally {
      client.release();
    }
  })();
});

// Update a proposal
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        throw new Error('Unauthorized access');
      }

      const { id } = req.params;
      const {
        proposal_title,
        submitted_by,
        submission_date,
        funding_agency,
        proposed_budget,
        status,
        remarks,
        approval_date,
        rejection_date,
        rejection_reason
      } = req.body;

      // Get group_id
      const groupResult = await client.query(
        'SELECT group_id FROM technical_groups WHERE LOWER(group_name) = LOWER($1)',
        [authReq.user.username]
      );

      const group_id = groupResult.rows[0]?.group_id;
      if (!group_id) {
        throw new Error('Technical group not found');
      }

      // Check if proposal exists and belongs to this group
      const existingProposal = await client.query(
        'SELECT * FROM proposals WHERE proposal_id = $1 AND group_id = $2',
        [id, group_id]
      );

      if (existingProposal.rows.length === 0) {
        throw new Error('Proposal not found');
      }

      // Convert empty strings to null for optional fields
      const remarksValue = remarks === '' ? null : remarks;
      const approvalDateValue = approval_date === '' ? null : approval_date;
      const rejectionDateValue = rejection_date === '' ? null : rejection_date;
      const rejectionReasonValue = rejection_reason === '' ? null : rejection_reason;

      // Update proposal
      await client.query(
        `UPDATE proposals SET
          proposal_title = $1,
          submitted_by = $2,
          submission_date = $3,
          funding_agency = $4,
          proposed_budget = $5,
          status = $6,
          remarks = $7,
          approval_date = $8,
          rejection_date = $9,
          rejection_reason = $10,
          updated_at = CURRENT_TIMESTAMP
         WHERE proposal_id = $11 AND group_id = $12`,
        [
          proposal_title,
          submitted_by,
          submission_date,
          funding_agency,
          proposed_budget,
          status,
          remarksValue,
          approvalDateValue,
          rejectionDateValue,
          rejectionReasonValue,
          id,
          group_id
        ]
      );

      await client.query('COMMIT');

      // Fetch the updated proposal data
      const updatedProposal = await pool.query(
        `SELECT 
          p.*,
          e.employee_name as submitted_by_name,
          tg.group_name
         FROM proposals p
         LEFT JOIN hr_employees e ON p.submitted_by = e.employee_id
         LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
         WHERE p.proposal_id = $1`,
        [id]
      );

      res.json(updatedProposal.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating proposal:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    } finally {
      client.release();
    }
  })();
});

// Update proposal status
router.put('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        throw new Error('Unauthorized access');
      }

      const { id } = req.params;
      const { new_status, remarks, update_date } = req.body;

      // Get group_id
      const groupResult = await client.query(
        'SELECT group_id FROM technical_groups WHERE LOWER(group_name) = LOWER($1)',
        [authReq.user.username]
      );

      const group_id = groupResult.rows[0]?.group_id;
      if (!group_id) {
        throw new Error('Technical group not found');
      }

      // Check if proposal exists and belongs to this group
      const existingProposal = await client.query(
        'SELECT * FROM proposals WHERE proposal_id = $1 AND group_id = $2',
        [id, group_id]
      );

      if (existingProposal.rows.length === 0) {
        throw new Error('Proposal not found');
      }

      const oldStatus = existingProposal.rows[0].status;

      // Update proposal status
      await client.query(
        'UPDATE proposals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $2',
        [new_status, id]
      );

      // Add status history
      await client.query(
        `INSERT INTO proposal_status_history (
          proposal_id, old_status, new_status, remarks, update_date
        ) VALUES ($1, $2, $3, $4, $5)`,
        [id, oldStatus, new_status, remarks || 'Status updated', update_date]
      );

      await client.query('COMMIT');

      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating proposal status:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    } finally {
      client.release();
    }
  })();
});

// Delete a proposal
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        throw new Error('Unauthorized access');
      }

      const { id } = req.params;

      // Get group_id
      const groupResult = await client.query(
        'SELECT group_id FROM technical_groups WHERE LOWER(group_name) = LOWER($1)',
        [authReq.user.username]
      );

      const group_id = groupResult.rows[0]?.group_id;
      if (!group_id) {
        throw new Error('Technical group not found');
      }

      // Check if proposal exists and belongs to this group
      const existingProposal = await client.query(
        'SELECT * FROM proposals WHERE proposal_id = $1 AND group_id = $2',
        [id, group_id]
      );

      if (existingProposal.rows.length === 0) {
        throw new Error('Proposal not found');
      }

      // Delete proposal
      await client.query(
        'DELETE FROM proposals WHERE proposal_id = $1 AND group_id = $2',
        [id, group_id]
      );

      await client.query('COMMIT');

      res.json({ message: 'Proposal deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting proposal:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    } finally {
      client.release();
    }
  })();
});

export default router; 