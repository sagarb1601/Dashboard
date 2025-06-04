import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { checkTableExists } from '../utils/db';

const router = express.Router();

// Get all employees
router.get('/employees', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /employees ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        const tableExists = await checkTableExists('hr_employees');
        console.log('Table check result:', tableExists);

        if (!tableExists.exists) {
            res.status(404).json({ error: 'Employees table does not exist' });
            return;
        }

        const result = await pool.query(
            `SELECT e.*, d.designation, d.designation_full, t.group_name, t.group_description
             FROM hr_employees e
             LEFT JOIN hr_designations d ON e.designation_id = d.designation_id
             LEFT JOIN technical_groups t ON e.technical_group_id = t.group_id
             ORDER BY e.employee_id`
        );

        console.log('Query executed successfully');
        console.log('Number of employees found:', result.rows.length);

        res.json(result.rows);
    } catch (error) {
        console.error('Error getting employees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all designations
router.get('/designations', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /designations ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        // First check if the table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'hr_designations'
            );
        `);
        
        console.log('Table check result:', tableCheck.rows[0]);
        
        if (!tableCheck.rows[0].exists) {
            console.log('Creating hr_designations table...');
            // Create the table if it doesn't exist
            await pool.query(`
                CREATE TABLE hr_designations (
                    designation_id SERIAL PRIMARY KEY,
                    designation VARCHAR(100) NOT NULL,
                    designation_full VARCHAR(100),
                    level INTEGER,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Table created successfully');
        }

        // Check if there's any data
        const result = await pool.query(`
            SELECT designation_id, designation, designation_full, level 
            FROM hr_designations 
            ORDER BY level, designation
        `);

        console.log('Initial query result count:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('No data found, inserting initial data...');
            // Insert initial data
            await pool.query(`
                INSERT INTO hr_designations (designation, designation_full, level) VALUES
                ('PE', 'Project Engineer', 1),
                ('KA', 'Knowledge Associate', 1),
                ('SPE', 'Senior Project Engineer', 2),
                ('PA', 'Project Associate', 1)
            `);

            const newResult = await pool.query(`
                SELECT designation_id, designation, designation_full, level 
                FROM hr_designations 
                ORDER BY level, designation
            `);
            console.log('Sending initial data, count:', newResult.rows.length);
            res.json(newResult.rows);
        } else {
            console.log('Sending existing data');
            res.json(result.rows);
        }
    } catch (error) {
        console.error('=== Error in GET /designations ===');
        console.error('Full error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : '');
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});

// Get all technical groups
router.get('/technical_groups', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /technical_groups ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        // First check if the table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'technical_groups'
            );
        `);
        
        console.log('Table check result:', tableCheck.rows[0]);
        
        if (!tableCheck.rows[0].exists) {
            console.log('Creating technical_groups table...');
            // Create the table if it doesn't exist
            await pool.query(`
                CREATE TABLE technical_groups (
                    group_id SERIAL PRIMARY KEY,
                    group_name VARCHAR(100) NOT NULL,
                    group_description VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Table created successfully');
        }

        // Check if there's any data
        const result = await pool.query(`
            SELECT group_id, group_name, group_description 
            FROM technical_groups 
            ORDER BY group_name
        `);

        console.log('Initial query result count:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('No data found, inserting initial data...');
            // Insert initial data
            await pool.query(`
                INSERT INTO technical_groups (group_name, group_description) VALUES
                ('SOULWARE', 'Software Development Group'),
                ('VLSI', 'VLSI Design Group'),
                ('HPC', 'High Performance Computing Group'),
                ('SSP', 'System Software and Platform Group'),
                ('AI', 'Artificial Intelligence Group'),
                ('IoT', 'Internet of Things Group')
            `);

            const newResult = await pool.query(`
                SELECT group_id, group_name, group_description 
                FROM technical_groups 
                ORDER BY group_name
            `);
            console.log('Sending initial data, count:', newResult.rows.length);
            res.json(newResult.rows);
        } else {
            console.log('Sending existing data');
            res.json(result.rows);
        }
    } catch (error) {
        console.error('=== Error in GET /technical_groups ===');
        console.error('Full error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : '');
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});

// Add new employee
router.post('/employees', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== POST /employees ===');
        console.log('User:', req.user);
        console.log('Request body:', req.body);

        const {
            employee_id,
            employee_name,
            join_date,
            designation_id,
            initial_designation_id,
            technical_group_id,
            status,
            gender,
            level,
            centre
        } = req.body;

        // Validate required fields
        if (!employee_id || !employee_name || !gender || !centre || !designation_id || !initial_designation_id || !technical_group_id) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Check if employee_id already exists
        const employeeExists = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM hr_employees WHERE employee_id = $1)',
            [employee_id]
        );

        if (employeeExists.rows[0].exists) {
            res.status(400).json({ error: 'Employee ID already exists' });
            return;
        }

        // Validate foreign keys
        const designationExists = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM hr_designations WHERE designation_id = $1 OR designation_id = $2)',
            [designation_id, initial_designation_id]
        );

        const technicalGroupExists = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM technical_groups WHERE group_id = $1)',
            [technical_group_id]
        );

        if (!designationExists.rows[0].exists) {
            res.status(400).json({ error: 'Invalid designation_id or initial_designation_id' });
            return;
        }

        if (!technicalGroupExists.rows[0].exists) {
            res.status(400).json({ error: 'Invalid technical_group_id' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO hr_employees 
            (employee_id, employee_name, join_date, designation_id, initial_designation_id, technical_group_id, 
             status, gender, level, centre)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [employee_id, employee_name, join_date, designation_id, initial_designation_id, technical_group_id,
             status, gender, level, centre]
        );

        // Fetch the complete employee data with joined tables
        const completeEmployee = await pool.query(`
            SELECT e.*, 
                   d.designation, d.designation_full,
                   t.group_name, t.group_description
            FROM hr_employees e
            LEFT JOIN hr_designations d ON e.designation_id = d.designation_id
            LEFT JOIN technical_groups t ON e.technical_group_id = t.group_id
            WHERE e.employee_id = $1
        `, [result.rows[0].employee_id]);

        res.status(201).json(completeEmployee.rows[0]);
    } catch (error) {
        console.error('=== Error in POST /employees ===');
        console.error('Full error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : '');
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});

// Update employee
router.put('/employees/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            employee_name,
            join_date,
            designation_id,
            technical_group_id,
            status,
            gender,
            level,
            centre
        } = req.body;

        // Get current employee data
        const currentEmployee = await pool.query(
            'SELECT * FROM hr_employees WHERE employee_id = $1',
            [id]
        );

        if (currentEmployee.rows.length === 0) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }

        const current = currentEmployee.rows[0];

        // Prepare update data using current values as defaults
        const updateData = {
            employee_name: employee_name || current.employee_name,
            join_date: join_date || current.join_date,
            designation_id: designation_id || current.designation_id,
            technical_group_id: technical_group_id || current.technical_group_id,
            status: status || current.status,
            gender: gender || current.gender,
            level: level || current.level,
            centre: centre || current.centre
        };

        const result = await pool.query(
            `UPDATE hr_employees 
            SET employee_name = $1, 
                join_date = $2, 
                designation_id = $3, 
                technical_group_id = $4, 
                status = $5,
                gender = $6, 
                level = $7, 
                centre = $8
            WHERE employee_id = $9
            RETURNING *`,
            [
                updateData.employee_name,
                updateData.join_date,
                updateData.designation_id,
                updateData.technical_group_id,
                updateData.status,
                updateData.gender,
                updateData.level,
                updateData.centre,
                id
            ]
        );

        // Fetch the complete employee data with joined tables
        const completeEmployee = await pool.query(`
            SELECT e.*, 
                   d.designation, d.designation_full,
                   t.group_name, t.group_description
            FROM hr_employees e
            LEFT JOIN hr_designations d ON e.designation_id = d.designation_id
            LEFT JOIN technical_groups t ON e.technical_group_id = t.group_id
            WHERE e.employee_id = $1
        `, [id]);

        res.json(completeEmployee.rows[0]);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get employee by ID
router.get('/employees/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT e.*, d.designation, d.designation_full, t.group_name, t.group_description
             FROM hr_employees e
             LEFT JOIN hr_designations d ON e.designation_id = d.designation_id
             LEFT JOIN technical_groups t ON e.technical_group_id = t.group_id
             WHERE e.employee_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 