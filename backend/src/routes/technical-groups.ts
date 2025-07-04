import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get all technical groups
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /technical-groups ===');
        console.log('User:', req.user);

        const result = await pool.query(
            'SELECT group_id, group_name, group_description FROM technical_groups ORDER BY group_name'
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error getting technical groups:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new technical group
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== POST /technical-groups ===');
        console.log('User:', req.user);
        console.log('Request body:', req.body);

        const { group_name, group_description } = req.body;

        if (!group_name || !group_description) {
            res.status(400).json({ error: 'group_name and group_description are required' });
            return;
        }

        const result = await pool.query(
            'INSERT INTO technical_groups (group_name, group_description) VALUES ($1, $2) RETURNING *',
            [group_name, group_description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding technical group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 