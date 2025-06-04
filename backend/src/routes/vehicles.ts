import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import type { Vehicle, VehicleCreate, VehicleServicing, VehicleServicingCreate, VehicleInsurance, VehicleInsuranceCreate } from '../types/vehicles';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Vehicle Routes
router.get('/vehicles', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM transport_vehicles ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: 'Failed to fetch vehicles' });
    }
});

router.post('/vehicles', async (req: Request<{}, {}, VehicleCreate>, res: Response) => {
    const { company_name, model, registration_no } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transport_vehicles (company_name, model, registration_no) VALUES ($1, $2, $3) RETURNING *',
            [company_name, model, registration_no]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(500).json({ message: 'Failed to create vehicle' });
    }
});

router.put('/vehicles/:id', async (req: Request<{ id: string }, {}, VehicleCreate>, res: Response) => {
    const { id } = req.params;
    const { company_name, model, registration_no } = req.body;
    try {
        const result = await pool.query(
            'UPDATE transport_vehicles SET company_name = $1, model = $2, registration_no = $3 WHERE vehicle_id = $4 RETURNING *',
            [company_name, model, registration_no, id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Vehicle not found' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ message: 'Failed to update vehicle' });
    }
});

router.delete('/vehicles/:id', async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM transport_vehicles WHERE vehicle_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Vehicle not found' });
            return;
        }
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ message: 'Failed to delete vehicle' });
    }
});

// Servicing Routes
router.get('/vehicles/:id/servicing', async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM vehicle_servicing WHERE vehicle_id = $1 ORDER BY service_date DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching servicing records:', error);
        res.status(500).json({ message: 'Failed to fetch servicing records' });
    }
});

router.post('/vehicles/servicing', async (req: Request<{}, {}, VehicleServicingCreate>, res: Response) => {
    const { vehicle_id, service_date, next_service_date, service_description, servicing_amount } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vehicle_servicing (vehicle_id, service_date, next_service_date, service_description, servicing_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [vehicle_id, service_date, next_service_date, service_description, servicing_amount]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating servicing record:', error);
        res.status(500).json({ message: 'Failed to create servicing record' });
    }
});

// Insurance Routes
router.get('/vehicles/:id/insurance', async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM vehicle_insurance WHERE vehicle_id = $1 ORDER BY insurance_start_date DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching insurance records:', error);
        res.status(500).json({ message: 'Failed to fetch insurance records' });
    }
});

router.post('/vehicles/insurance', async (req: Request<{}, {}, VehicleInsuranceCreate>, res: Response) => {
    const { vehicle_id, insurance_provider, policy_number, insurance_start_date, insurance_end_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vehicle_insurance (vehicle_id, insurance_provider, policy_number, insurance_start_date, insurance_end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [vehicle_id, insurance_provider, policy_number, insurance_start_date, insurance_end_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating insurance record:', error);
        res.status(500).json({ message: 'Failed to create insurance record' });
    }
});

export default router; 