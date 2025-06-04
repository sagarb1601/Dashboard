import express, { Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get all manpower counts
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const result = await pool.query(`
            SELECT * FROM manpower_counts
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching manpower counts:', error);
        res.status(500).json({ error: 'Failed to fetch manpower counts' });
    }
});

// Add new manpower count
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            on_rolls,
            cocp,
            regular,
            cc,
            gbc,
            ka,
            spe,
            pe,
            pa
        } = req.body;

        const result = await pool.query(`
            INSERT INTO manpower_counts (
                on_rolls,
                cocp,
                regular,
                cc,
                gbc,
                ka,
                spe,
                pe,
                pa
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [on_rolls, cocp, regular, cc, gbc, ka, spe, pe, pa]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding manpower count:', error);
        res.status(500).json({ error: 'Failed to add manpower count' });
    }
});

// Update manpower count
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            on_rolls,
            cocp,
            regular,
            cc,
            gbc,
            ka,
            spe,
            pe,
            pa
        } = req.body;

        // Check if the record exists
        const checkResult = await pool.query(
            'SELECT * FROM manpower_counts WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Manpower record not found' });
            return;
        }

        const result = await pool.query(`
            UPDATE manpower_counts 
            SET on_rolls = $1,
                cocp = $2,
                regular = $3,
                cc = $4,
                gbc = $5,
                ka = $6,
                spe = $7,
                pe = $8,
                pa = $9
            WHERE id = $10
            RETURNING *
        `, [on_rolls, cocp, regular, cc, gbc, ka, spe, pe, pa, id]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating manpower count:', error);
        res.status(500).json({ error: 'Failed to update manpower count' });
    }
});

// Delete manpower count
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if the record exists
        const checkResult = await pool.query(
            'SELECT * FROM manpower_counts WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Manpower record not found' });
            return;
        }

        await pool.query(
            'DELETE FROM manpower_counts WHERE id = $1',
            [id]
        );

        res.json({ message: 'Manpower record deleted successfully' });
    } catch (error) {
        console.error('Error deleting manpower count:', error);
        res.status(500).json({ error: 'Failed to delete manpower count' });
    }
});

export default router; 