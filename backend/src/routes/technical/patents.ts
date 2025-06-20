import { Router, Request, Response, NextFunction } from 'express';
import pool from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation schema for patent creation/update
const patentSchema = z.object({
  patent_title: z.string().min(1, 'Patent title is required'),
  filing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  application_number: z.string().min(1, 'Application number is required'),
  status: z.enum(['Filed', 'Under Review', 'Granted', 'Rejected']),
  remarks: z.string(),
  inventors: z.array(z.number()).min(1, 'At least one inventor is required'),
  grant_date: z.string().refine(
    (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
    'Invalid date format'
  ),
  rejection_date: z.string().refine(
    (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
    'Invalid date format'
  ),
  rejection_reason: z.string()
});

// Get all patents for a group
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    try {
      console.log('GET /patents - Request user:', authReq.user);
      
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

      // Get patents with inventor names, group name, and status history
      const result = await pool.query(
        `SELECT 
          p.patent_id,
          p.patent_title,
          p.filing_date,
          p.application_number,
          p.status,
          p.remarks,
          p.created_at,
          p.grant_date,
          p.rejection_date,
          p.rejection_reason,
          tg.group_name,
          json_agg(DISTINCT jsonb_build_object(
            'employee_id', i.employee_id,
            'employee_name', he.employee_name
          )) as inventors,
          (
            SELECT json_agg(jsonb_build_object(
              'history_id', h.history_id,
              'old_status', h.old_status,
              'new_status', h.new_status,
              'remarks', h.remarks,
              'update_date', to_char(h.update_date, 'YYYY-MM-DD'),
              'updated_by_group_name', tg2.group_name
            ) ORDER BY h.update_date DESC)
            FROM patent_status_history h
            LEFT JOIN technical_groups tg2 ON h.updated_by_group = tg2.group_id
            WHERE h.patent_id = p.patent_id
          ) as status_history
         FROM patents p
         LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
         LEFT JOIN patent_inventors i ON p.patent_id = i.patent_id
         LEFT JOIN hr_employees he ON i.employee_id = he.employee_id
         WHERE p.group_id = $1
         GROUP BY 
           p.patent_id,
           p.patent_title,
           p.filing_date,
           p.application_number,
           p.status,
           p.remarks,
           p.created_at,
           p.grant_date,
           p.rejection_date,
           p.rejection_reason,
           tg.group_name
         ORDER BY p.filing_date DESC`,
        [group_id]
      );

      console.log('Patents query result:', result.rows.length, 'rows');
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  })();
});

// Get available inventors (employees) for the group
router.get('/inventors', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    try {
      console.log('GET /inventors - Request user:', authReq.user);
      
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
      console.error('Error in /inventors endpoint:', error);
      next(error);
    }
  })();
});

// Create a new patent
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

      const validatedData = patentSchema.parse(req.body);

      // Convert empty strings to null for date fields
      const grantDate = validatedData.grant_date === '' ? null : validatedData.grant_date;
      const rejectionDate = validatedData.rejection_date === '' ? null : validatedData.rejection_date;
      const remarks = validatedData.remarks === '' ? null : validatedData.remarks;
      const rejectionReason = validatedData.rejection_reason === '' ? null : validatedData.rejection_reason;

      // Insert patent
      const patentResult = await client.query(
        `INSERT INTO patents (
          patent_title,
          filing_date,
          application_number,
          status,
          remarks,
          grant_date,
          rejection_date,
          rejection_reason,
          group_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING patent_id`,
        [
          validatedData.patent_title,
          validatedData.filing_date,
          validatedData.application_number,
          validatedData.status,
          remarks,
          grantDate,
          rejectionDate,
          rejectionReason,
          group_id
        ]
      );

      const patentId = patentResult.rows[0].patent_id;

      // Insert inventors
      if (validatedData.inventors.length > 0) {
        const inventorValues = validatedData.inventors.map(employeeId => 
          `(${patentId}, ${employeeId})`
        ).join(', ');

        await client.query(`
          INSERT INTO patent_inventors (patent_id, employee_id)
          VALUES ${inventorValues}
        `);
      }

      // Insert initial status history using the filing_date
      await client.query(
        `INSERT INTO patent_status_history (
          patent_id, old_status, new_status, remarks, updated_by_group, update_date
        ) VALUES ($1, 'Filed', $2, $3, $4, $5)`,
        [
          patentId,
          validatedData.status,
          'Patent filed',
          group_id,
          validatedData.filing_date
        ]
      );

      await client.query('COMMIT');

      // Fetch the complete patent data with status history
      const completePatent = await pool.query(
        `SELECT 
          p.patent_id,
          p.patent_title,
          p.filing_date,
          p.application_number,
          p.status,
          p.remarks,
          p.created_at,
          p.grant_date,
          p.rejection_date,
          p.rejection_reason,
          tg.group_name,
          json_agg(DISTINCT jsonb_build_object(
            'employee_id', i.employee_id,
            'employee_name', he.employee_name
          )) as inventors,
          (
            SELECT json_agg(jsonb_build_object(
              'history_id', h.history_id,
              'old_status', h.old_status,
              'new_status', h.new_status,
              'remarks', h.remarks,
              'update_date', to_char(h.update_date, 'YYYY-MM-DD'),
              'updated_by_group_name', tg2.group_name
            ) ORDER BY h.update_date DESC)
            FROM patent_status_history h
            LEFT JOIN technical_groups tg2 ON h.updated_by_group = tg2.group_id
            WHERE h.patent_id = p.patent_id
          ) as status_history
         FROM patents p
         LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
         LEFT JOIN patent_inventors i ON p.patent_id = i.patent_id
         LEFT JOIN hr_employees he ON i.employee_id = he.employee_id
         WHERE p.patent_id = $1
         GROUP BY 
           p.patent_id,
           p.patent_title,
           p.filing_date,
           p.application_number,
           p.status,
           p.remarks,
           p.created_at,
           p.grant_date,
           p.rejection_date,
           p.rejection_reason,
           tg.group_name`,
        [patentId]
      );

      res.json(completePatent.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  })();
});

// Update a patent
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
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

      const patentId = parseInt(req.params.id);
      const validatedData = patentSchema.parse(req.body);

      // Convert empty strings to null for date fields
      const grantDate = validatedData.grant_date === '' ? null : validatedData.grant_date;
      const rejectionDate = validatedData.rejection_date === '' ? null : validatedData.rejection_date;
      const remarks = validatedData.remarks === '' ? null : validatedData.remarks;
      const rejectionReason = validatedData.rejection_reason === '' ? null : validatedData.rejection_reason;

      // Check if patent exists and belongs to the group
      const patentCheck = await client.query(
        'SELECT 1, status as current_status, filing_date FROM patents WHERE patent_id = $1 AND group_id = $2',
        [patentId, group_id]
      );

      if (patentCheck.rows.length === 0) {
        throw new Error('Patent not found or not authorized');
      }

      const currentStatus = patentCheck.rows[0].current_status;
      const filingDate = patentCheck.rows[0].filing_date;

      // Update patent
      await client.query(
        `UPDATE patents SET
          patent_title = $1,
          filing_date = $2,
          application_number = $3,
          status = $4,
          remarks = $5,
          grant_date = $6,
          rejection_date = $7,
          rejection_reason = $8,
          updated_at = CURRENT_TIMESTAMP,
          updated_by_group = $9
        WHERE patent_id = $10`,
        [
          validatedData.patent_title,
          validatedData.filing_date,
          validatedData.application_number,
          validatedData.status,
          remarks,
          grantDate,
          rejectionDate,
          rejectionReason,
          group_id,
          patentId
        ]
      );

      // Update inventors if changed
      const currentInventors = await client.query(
        'SELECT employee_id FROM patent_inventors WHERE patent_id = $1',
        [patentId]
      );
      const currentInventorIds = currentInventors.rows.map(row => row.employee_id);
      const newInventorIds = validatedData.inventors;

      // Remove inventors that are no longer in the list
      const inventorsToRemove = currentInventorIds.filter(id => !newInventorIds.includes(id));
      if (inventorsToRemove.length > 0) {
        await client.query(
          'DELETE FROM patent_inventors WHERE patent_id = $1 AND employee_id = ANY($2)',
          [patentId, inventorsToRemove]
        );
      }

      // Add new inventors
      const inventorsToAdd = newInventorIds.filter(id => !currentInventorIds.includes(id));
      if (inventorsToAdd.length > 0) {
        const inventorValues = inventorsToAdd.map(employeeId => 
          `(${patentId}, ${employeeId})`
        ).join(', ');

        await client.query(`
          INSERT INTO patent_inventors (patent_id, employee_id)
          VALUES ${inventorValues}
        `);
      }

      // Insert status history if status changed
      if (currentStatus !== validatedData.status) {
        // Check if this is the first status history entry
        const historyCheck = await client.query(
          'SELECT COUNT(*) as count FROM patent_status_history WHERE patent_id = $1',
          [patentId]
        );

        const isFirstEntry = parseInt(historyCheck.rows[0].count) === 0;

        await client.query(
          `INSERT INTO patent_status_history (
            patent_id, old_status, new_status, remarks, updated_by_group, update_date
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            patentId,
            currentStatus,
            validatedData.status,
            validatedData.remarks || 'Status updated',
            group_id,
            isFirstEntry ? filingDate : validatedData.filing_date  // Use filing date for first entry
          ]
        );
      }

      await client.query('COMMIT');

      // Fetch the complete patent data with status history
      const completePatent = await pool.query(
        `SELECT 
          p.patent_id,
          p.patent_title,
          p.filing_date,
          p.application_number,
          p.status,
          p.remarks,
          p.created_at,
          p.grant_date,
          p.rejection_date,
          p.rejection_reason,
          tg.group_name,
          json_agg(DISTINCT jsonb_build_object(
            'employee_id', i.employee_id,
            'employee_name', he.employee_name
          )) as inventors,
          (
            SELECT json_agg(jsonb_build_object(
              'history_id', h.history_id,
              'old_status', h.old_status,
              'new_status', h.new_status,
              'remarks', h.remarks,
              'update_date', to_char(h.update_date, 'YYYY-MM-DD'),
              'updated_by_group_name', tg2.group_name
            ) ORDER BY h.update_date DESC)
            FROM patent_status_history h
            LEFT JOIN technical_groups tg2 ON h.updated_by_group = tg2.group_id
            WHERE h.patent_id = p.patent_id
          ) as status_history
         FROM patents p
         LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
         LEFT JOIN patent_inventors i ON p.patent_id = i.patent_id
         LEFT JOIN hr_employees he ON i.employee_id = he.employee_id
         WHERE p.patent_id = $1
         GROUP BY 
           p.patent_id,
           p.patent_title,
           p.filing_date,
           p.application_number,
           p.status,
           p.remarks,
           p.created_at,
           p.grant_date,
           p.rejection_date,
           p.rejection_reason,
           tg.group_name`,
        [patentId]
      );

      res.json(completePatent.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  })();
});

// Get patent status history
router.get('/:id/history', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    try {
      const patentId = parseInt(req.params.id);
      if (isNaN(patentId)) {
        return res.status(400).json({ error: 'Invalid patent ID' });
      }

      // Get status history with group names
      const result = await pool.query(
        `SELECT 
          h.history_id,
          h.patent_id,
          h.old_status,
          h.new_status,
          h.remarks,
          to_char(h.update_date, 'YYYY-MM-DD') as update_date,
          tg.group_name as updated_by_group_name
         FROM patent_status_history h
         LEFT JOIN technical_groups tg ON h.updated_by_group = tg.group_id
         WHERE h.patent_id = $1
         ORDER BY h.update_date DESC`,
        [patentId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching patent history:', error);
      next(error);
    }
  })();
});

// Update patent status
router.put('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        throw new Error('Unauthorized access');
      }

      const patentId = parseInt(req.params.id);
      if (isNaN(patentId)) {
        throw new Error('Invalid patent ID');
      }

      const { new_status, remarks, update_date } = req.body;
      if (!new_status || !['Filed', 'Under Review', 'Granted', 'Rejected'].includes(new_status)) {
        throw new Error('Invalid status');
      }

      if (!update_date || !/^\d{4}-\d{2}-\d{2}$/.test(update_date)) {
        throw new Error('Invalid update date format');
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

      // Get current status and filing date
      const currentPatent = await client.query(
        'SELECT status, filing_date FROM patents WHERE patent_id = $1',
        [patentId]
      );

      if (currentPatent.rows.length === 0) {
        throw new Error('Patent not found');
      }

      const old_status = currentPatent.rows[0].status;
      const filing_date = currentPatent.rows[0].filing_date;

      // Check if this is the first status history entry
      const historyCheck = await client.query(
        'SELECT COUNT(*) as count FROM patent_status_history WHERE patent_id = $1',
        [patentId]
      );

      const isFirstEntry = parseInt(historyCheck.rows[0].count) === 0;

      // Update patent status
      await client.query(
        `UPDATE patents 
         SET status = $1::VARCHAR(50),
             grant_date = CASE WHEN $1::VARCHAR(50) = 'Granted'::VARCHAR(50) THEN $2::DATE ELSE grant_date END,
             rejection_date = CASE WHEN $1::VARCHAR(50) = 'Rejected'::VARCHAR(50) THEN $2::DATE ELSE rejection_date END
         WHERE patent_id = $3`,
        [new_status, update_date, patentId]
      );

      // Record status change
      await client.query(
        `INSERT INTO patent_status_history (
          patent_id, old_status, new_status, remarks, updated_by_group, update_date
        ) VALUES ($1, $2::VARCHAR(50), $3::VARCHAR(50), $4, $5, $6::DATE)`,
        [
          patentId,
          old_status,
          new_status,
          remarks || 'Status updated',
          group_id,
          isFirstEntry ? filing_date : update_date  // Use filing date for first entry
        ]
      );

      await client.query('COMMIT');

      // Fetch updated patent with history
      const updatedPatent = await pool.query(
        `SELECT 
          p.patent_id,
          p.patent_title,
          p.filing_date,
          p.application_number,
          p.status,
          p.remarks,
          p.grant_date,
          p.rejection_date,
          p.rejection_reason,
          tg.group_name,
          json_agg(DISTINCT jsonb_build_object(
            'employee_id', i.employee_id,
            'employee_name', he.employee_name
          )) as inventors,
          (
            SELECT json_agg(jsonb_build_object(
              'history_id', h.history_id,
              'old_status', h.old_status,
              'new_status', h.new_status,
              'remarks', h.remarks,
              'update_date', to_char(h.update_date, 'YYYY-MM-DD'),
              'updated_by_group_name', tg2.group_name
            ) ORDER BY h.update_date DESC)
            FROM patent_status_history h
            LEFT JOIN technical_groups tg2 ON h.updated_by_group = tg2.group_id
            WHERE h.patent_id = p.patent_id
          ) as status_history
         FROM patents p
         LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
         LEFT JOIN patent_inventors i ON p.patent_id = i.patent_id
         LEFT JOIN hr_employees he ON i.employee_id = he.employee_id
         WHERE p.patent_id = $1
         GROUP BY 
           p.patent_id,
           p.patent_title,
           p.filing_date,
           p.application_number,
           p.status,
           p.remarks,
           p.grant_date,
           p.rejection_date,
           p.rejection_reason,
           tg.group_name`,
        [patentId]
      );

      res.json(updatedPatent.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  })();
});

// Delete a patent
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!authReq.user?.role || authReq.user.role.toLowerCase() !== 'tg') {
        throw new Error('Unauthorized access');
      }

      const patentId = parseInt(req.params.id);
      if (isNaN(patentId)) {
        throw new Error('Invalid patent ID');
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

      // Check if patent exists and belongs to the group
      const patentCheck = await client.query(
        'SELECT 1 FROM patents WHERE patent_id = $1 AND group_id = $2',
        [patentId, group_id]
      );

      if (patentCheck.rows.length === 0) {
        throw new Error('Patent not found or not authorized');
      }

      // Delete related records first
      await client.query('DELETE FROM patent_status_history WHERE patent_id = $1', [patentId]);
      await client.query('DELETE FROM patent_inventors WHERE patent_id = $1', [patentId]);
      await client.query('DELETE FROM patents WHERE patent_id = $1', [patentId]);

      await client.query('COMMIT');
      res.json({ message: 'Patent deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  })();
});

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error in patents route:', err);
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: err.errors });
  } else {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router; 