import { Router } from 'express';
import { pool } from '../db/setup';
import { authenticateToken } from '../middleware/auth';
import { QueryResult } from 'pg';

interface ExpenditureEntry {
  expenditure_id: number;
  project_id: number;
  field_id: number;
  year_number: number;
  period_type: string;
  period_number: number;
  amount_spent: number;
  expenditure_date: Date;
  remarks?: string;
}

const router = Router();

// Get expenditures for a project
router.get('/expenditures/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM project_expenditure_entries 
       WHERE project_id = $1 
       ORDER BY year_number, period_type, period_number, field_id`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    res.status(500).json({ error: 'Failed to fetch expenditures' });
  }
});

// Add multiple expenditure entries
router.post('/expenditures/bulk', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { expenditures } = req.body;

    // Validate expenditures array
    if (!Array.isArray(expenditures) || expenditures.length === 0) {
      throw new Error('Invalid expenditures data');
    }

    // Insert all expenditures
    const insertPromises = expenditures.map(entry => {
      const {
        project_id,
        field_id,
        year_number,
        period_type,
        period_number,
        amount_spent,
        expenditure_date,
        remarks
      } = entry;

      return client.query(
        `INSERT INTO project_expenditure_entries (
          project_id,
          field_id,
          year_number,
          period_type,
          period_number,
          amount_spent,
          expenditure_date,
          remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          project_id,
          field_id,
          year_number,
          period_type,
          period_number,
          amount_spent,
          expenditure_date,
          remarks
        ]
      );
    });

    const results = await Promise.all(insertPromises);
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Expenditures added successfully',
      expenditures: results.map((r: QueryResult<ExpenditureEntry>) => r.rows[0])
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding expenditures:', error);
    res.status(500).json({ error: 'Failed to add expenditures' });
  } finally {
    client.release();
  }
});

// Delete an expenditure entry
router.delete('/expenditures/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'DELETE FROM project_expenditure_entries WHERE expenditure_id = $1',
      [id]
    );
    res.json({ message: 'Expenditure deleted successfully' });
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    res.status(500).json({ error: 'Failed to delete expenditure' });
  }
});

export default router; 