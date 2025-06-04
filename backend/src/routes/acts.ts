import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all courses
router.get('/courses', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query(
            'SELECT * FROM acts_course ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new course
router.post('/courses', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            course_name,
            batch_name,
            batch_id,
            year,
            students_enrolled,
            students_placed,
            course_fee
        } = req.body;

        const result = await pool.query(
            `INSERT INTO acts_course 
            (course_name, batch_name, batch_id, year, students_enrolled, students_placed, course_fee)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [course_name, batch_name, batch_id, year, students_enrolled, students_placed, course_fee]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Error adding course:', error);
        if (error.code === '23505' && error.constraint === 'acts_course_course_name_batch_id_key') {
            res.status(409).json({ 
                error: 'A course with this combination of course name and batch ID already exists.' 
            });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update course
router.put('/courses/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            course_name,
            batch_name,
            batch_id,
            year,
            students_enrolled,
            students_placed,
            course_fee
        } = req.body;

        const result = await pool.query(
            `UPDATE acts_course 
            SET course_name = $1, batch_name = $2, batch_id = $3, year = $4, 
                students_enrolled = $5, students_placed = $6, course_fee = $7
            WHERE id = $8
            RETURNING *`,
            [course_name, batch_name, batch_id, year, students_enrolled, students_placed, course_fee, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete course
router.delete('/courses/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM acts_course WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 