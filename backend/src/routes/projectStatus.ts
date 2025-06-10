import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get projects for user's technical group
router.get('/projects', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        
        const { username } = req.user;
        
        // Get projects for the user's technical group
        const projectsQuery = `
            SELECT fp.project_id, fp.project_name,
                   COALESCE(tps.status, 'Just Boarded') as status,
                   COALESCE(tps.updated_at, fp.created_at) as updated_at,
                   he.employee_name as updated_by_name
            FROM finance_projects fp
            JOIN technical_groups tg ON fp.group_id = tg.group_id
            LEFT JOIN technical_project_status tps ON fp.project_id = tps.project_id
            LEFT JOIN hr_employees he ON tps.updated_by = he.employee_id
            WHERE LOWER(tg.group_name) = LOWER($1)
            ORDER BY tps.updated_at DESC NULLS LAST, fp.created_at DESC
        `;
        
        const { rows: projects } = await pool.query(projectsQuery, [username]);
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get employees for the same technical group
router.get('/employees', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { username } = req.user;

        const employeesQuery = `
            SELECT he.employee_id, he.employee_name 
            FROM hr_employees he
            JOIN technical_groups tg ON he.technical_group_id = tg.group_id
            WHERE LOWER(tg.group_name) = LOWER($1)
            AND he.status = 'active'
            ORDER BY he.employee_name
        `;

        const { rows: employees } = await pool.query(employeesQuery, [username]);
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update project status
router.post('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { projectId, status, updatedBy } = req.body;
        const { username } = req.user;

        // Verify user has access to this project
        const accessCheckQuery = `
            SELECT 1 FROM finance_projects fp
            JOIN technical_groups tg ON fp.group_id = tg.group_id
            WHERE LOWER(tg.group_name) = LOWER($1)
            AND fp.project_id = $2
        `;
        const { rows } = await pool.query(accessCheckQuery, [username, projectId]);
        
        if (rows.length === 0) {
            res.status(403).json({ error: 'Access denied to this project' });
            return;
        }

        // Update or insert status
        const updateQuery = `
            INSERT INTO technical_project_status (project_id, status, updated_by)
            VALUES ($1, $2, $3)
            ON CONFLICT (project_id) 
            DO UPDATE SET 
                status = EXCLUDED.status,
                updated_by = EXCLUDED.updated_by,
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(updateQuery, [projectId, status, updatedBy]);
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new technical project
router.post('/project', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { projectName, projectDescription } = req.body;
        const { username } = req.user;

        const insertQuery = `
            INSERT INTO technical_projects (project_name, project_description, group_name)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [projectName, projectDescription, username]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 