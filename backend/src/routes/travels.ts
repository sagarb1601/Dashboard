import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkRole } from '../middleware/roles';
import type { Travel, TravelCreate, TravelUpdate } from '../types/travels';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as RequestHandler);

// Update role check middleware to allow both ED and EDOFC roles
const roleCheckMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role?.toLowerCase();
    if (userRole === 'ed' || userRole === 'edofc') {
        next();
    } else {
        console.log('Access denied for role:', userRole);
        res.status(403).json({ error: 'Access denied. Only ED and EDOFC roles are allowed.' });
    }
};

// Apply role check middleware to all routes
router.use(roleCheckMiddleware);

// Get all travels
const getAllTravels: RequestHandler = async (_req, res, next): Promise<void> => {
    try {
        console.log('Fetching all travels...');
        const result = await pool.query(
            'SELECT id, travel_type, location, onward_date, return_date, purpose, accommodation, remarks, COALESCE(status, \'going\') as status, remarks as deputing_remarks, created_at, updated_at FROM travels ORDER BY onward_date DESC'
        );
        console.log(`Found ${result.rows.length} travels`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getAllTravels:', error);
        next(error);
    }
};
router.get('/', getAllTravels);

// Get a single travel by ID
const getTravelById: RequestHandler<{ id: string }> = async (req, res, next): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, travel_type, location, onward_date, return_date, purpose, accommodation, remarks, COALESCE(status, \'going\') as status, remarks as deputing_remarks, created_at, updated_at FROM travels WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Travel not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};
router.get('/:id', getTravelById);

// Create a new travel
const createTravel: RequestHandler<{}, {}, TravelCreate> = async (req, res, next): Promise<void> => {
    try {
        const travel = req.body;
        const result = await pool.query(
            `INSERT INTO travels (
                travel_type, location, onward_date, return_date,
                purpose, accommodation, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                travel.travel_type,
                travel.location,
                travel.onward_date,
                travel.return_date,
                travel.purpose,
                travel.accommodation,
                travel.remarks
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23514') { // Check constraint violation
            res.status(400).json({ error: 'Invalid travel type or dates' });
        } else {
            next(error);
        }
    }
};
router.post('/', createTravel);

// Update a travel
const updateTravel: RequestHandler<{ id: string }, {}, TravelUpdate> = async (req, res, next): Promise<void> => {
    try {
        const { id } = req.params;
        const travel = req.body;

        // Build the update query dynamically based on provided fields
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (travel.travel_type !== undefined) {
            updateFields.push(`travel_type = $${paramCount}`);
            values.push(travel.travel_type);
            paramCount++;
        }
        if (travel.location !== undefined) {
            updateFields.push(`location = $${paramCount}`);
            values.push(travel.location);
            paramCount++;
        }
        if (travel.onward_date !== undefined) {
            updateFields.push(`onward_date = $${paramCount}`);
            values.push(travel.onward_date);
            paramCount++;
        }
        if (travel.return_date !== undefined) {
            updateFields.push(`return_date = $${paramCount}`);
            values.push(travel.return_date);
            paramCount++;
        }
        if (travel.purpose !== undefined) {
            updateFields.push(`purpose = $${paramCount}`);
            values.push(travel.purpose);
            paramCount++;
        }
        if (travel.accommodation !== undefined) {
            updateFields.push(`accommodation = $${paramCount}`);
            values.push(travel.accommodation);
            paramCount++;
        }
        if (travel.remarks !== undefined) {
            updateFields.push(`remarks = $${paramCount}`);
            values.push(travel.remarks);
            paramCount++;
        }

        if (updateFields.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE travels 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Travel not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23514') { // Check constraint violation
            res.status(400).json({ error: 'Invalid travel type or dates' });
        } else {
            next(error);
        }
    }
};
router.put('/:id', updateTravel);

// Delete a travel
const deleteTravel: RequestHandler<{ id: string }> = async (req, res, next): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM travels WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Travel not found' });
            return;
        }

        res.json({ message: 'Travel deleted successfully' });
    } catch (error) {
        next(error);
    }
};
router.delete('/:id', deleteTravel);

// Update travel status
const updateTravelStatus: RequestHandler<{ id: string }, {}, { status: string; deputing_remarks?: string }> = async (req, res, next): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, deputing_remarks } = req.body;

        // Validate status
        if (!['going', 'not_going', 'deputing'].includes(status)) {
            res.status(400).json({ error: 'Invalid status. Must be going, not_going, or deputing' });
            return;
        }

        // If status is deputing, remarks are required
        if (status === 'deputing' && !deputing_remarks) {
            res.status(400).json({ error: 'Remarks are required when status is deputing' });
            return;
        }

        const result = await pool.query(
            `UPDATE travels 
            SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, travel_type, location, onward_date, return_date, purpose, accommodation, remarks, status, remarks as deputing_remarks, created_at, updated_at`,
            [status, deputing_remarks || null, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Travel not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error in updateTravelStatus:', error);
        next(error);
    }
};
router.patch('/:id/status', updateTravelStatus);

// Error handling middleware
router.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

export default router; 