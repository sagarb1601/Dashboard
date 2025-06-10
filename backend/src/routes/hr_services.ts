import express, { Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get all promotions
router.get('/promotions', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /promotions ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'hr_employee_promotions'
            );
        `);
        console.log('Table check result:', tableExists.rows[0]);

        if (!tableExists.rows[0].exists) {
            console.log('Promotions table does not exist');
            res.status(404).json({ error: 'Promotions table does not exist' });
            return;
        }

        const result = await pool.query(`
            SELECT 
                p.*,
                e.employee_name,
                d_from.designation as old_designation,
                d_to.designation as new_designation
            FROM hr_employee_promotions p
            JOIN hr_employees e ON p.employee_id = e.employee_id
            JOIN hr_designations d_from ON p.from_designation_id = d_from.designation_id
            JOIN hr_designations d_to ON p.to_designation_id = d_to.designation_id
            ORDER BY p.effective_date DESC
        `);
        
        console.log('Query result:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new promotion
router.post('/promotions', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { employee_id, to_designation_id, effective_date, remarks, level } = req.body;

        // Validate required fields
        if (!employee_id || !to_designation_id || !effective_date || !level) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // First disable the date order trigger if it exists
            await client.query('ALTER TABLE hr_employee_promotions DISABLE TRIGGER ensure_promotion_date_order;');
            await client.query('ALTER TABLE hr_employee_promotions DISABLE TRIGGER ensure_promotion_chain;');

            // Get employee details including initial designation
            const employeeResult = await client.query(
                'SELECT designation_id, initial_designation_id, join_date FROM hr_employees WHERE employee_id = $1',
                [employee_id]
            );

            if (employeeResult.rows.length === 0) {
                res.status(404).json({ error: 'Employee not found' });
                return;
            }

            // Check if promotion date is after join date
            if (new Date(effective_date) < new Date(employeeResult.rows[0].join_date)) {
                res.status(400).json({ error: 'Promotion date cannot be before employee join date' });
                return;
            }

            // Get the previous promotion based on the new effective date
            const prevPromotionResult = await client.query(
                `SELECT to_designation_id 
                FROM hr_employee_promotions 
                WHERE employee_id = $1 
                AND effective_date < $2
                ORDER BY effective_date DESC 
                LIMIT 1`,
                [employee_id, effective_date]
            );

            let from_designation_id;
            if (prevPromotionResult.rows.length === 0) {
                // For first promotion, use initial_designation_id
                from_designation_id = employeeResult.rows[0].initial_designation_id;
            } else {
                // For subsequent promotions, use the to_designation_id of the chronologically previous promotion
                from_designation_id = prevPromotionResult.rows[0].to_designation_id;
            }

            // Create the promotion record
            const result = await client.query(
                `INSERT INTO hr_employee_promotions 
                (employee_id, from_designation_id, to_designation_id, effective_date, remarks, level)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [employee_id, from_designation_id, to_designation_id, effective_date, remarks, level]
            );

            // Update employee's current designation if this is now the latest promotion
            const hasLaterPromotions = await client.query(
                `SELECT 1 FROM hr_employee_promotions 
                WHERE employee_id = $1 
                AND effective_date > $2`,
                [employee_id, effective_date]
            );

            if (hasLaterPromotions.rows.length === 0) {
                await client.query(
                    'UPDATE hr_employees SET designation_id = $1 WHERE employee_id = $2',
                    [to_designation_id, employee_id]
                );
            }

            // Re-enable the triggers
            await client.query('ALTER TABLE hr_employee_promotions ENABLE TRIGGER ensure_promotion_date_order;');
            await client.query('ALTER TABLE hr_employee_promotions ENABLE TRIGGER ensure_promotion_chain;');

            await client.query('COMMIT');

            // Fetch the complete promotion record with employee and designation names
            const completeResult = await pool.query(`
                SELECT 
                    p.*,
                    e.employee_name,
                    d_from.designation as old_designation,
                    d_to.designation as new_designation
                FROM hr_employee_promotions p
                JOIN hr_employees e ON p.employee_id = e.employee_id
                LEFT JOIN hr_designations d_from ON p.from_designation_id = d_from.designation_id
                JOIN hr_designations d_to ON p.to_designation_id = d_to.designation_id
                WHERE p.id = $1
            `, [result.rows[0].id]);

            res.status(201).json(completeResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error creating promotion:', error);
        res.status(error.status || 500).json({ 
            error: error.message || 'Internal server error'
        });
    }
});

// Get all transfers
router.get('/transfers', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /transfers ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'hr_group_transfer_history'
            );
        `);
        console.log('Table check result:', tableExists.rows[0]);

        if (!tableExists.rows[0].exists) {
            console.log('Transfers table does not exist');
            res.status(404).json({ error: 'Transfers table does not exist' });
            return;
        }

        const result = await pool.query(`
            SELECT t.*, 
                   e.employee_name,
                   g1.group_name as from_group_name,
                   g2.group_name as to_group_name
            FROM hr_group_transfer_history t
            JOIN hr_employees e ON t.employee_id = e.employee_id
            LEFT JOIN technical_groups g1 ON t.from_group_id = g1.group_id
            JOIN technical_groups g2 ON t.to_group_id = g2.group_id
            ORDER BY t.transfer_date DESC
        `);
        console.log('Query result:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new transfer
router.post('/transfers', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { employee_id, from_group_id, to_group_id, transfer_date, remarks } = req.body;

        // Validate required fields
        if (!employee_id || !to_group_id || !transfer_date) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO hr_group_transfer_history 
            (employee_id, from_group_id, to_group_id, transfer_date, remarks)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [employee_id, from_group_id, to_group_id, transfer_date, remarks]
        );

        // Update employee's technical group
        await pool.query(
            `UPDATE hr_employees 
            SET technical_group_id = $1
            WHERE employee_id = $2`,
            [to_group_id, employee_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all attrition records
router.get('/attrition', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /attrition ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'hr_attrition'
            );
        `);
        console.log('Table check result:', tableExists.rows[0]);

        if (!tableExists.rows[0].exists) {
            console.log('Attrition table does not exist');
            res.status(404).json({ error: 'Attrition table does not exist' });
            return;
        }

        const result = await pool.query(`
            SELECT a.*, e.employee_name
            FROM hr_attrition a
            JOIN hr_employees e ON a.employee_id = e.employee_id
            ORDER BY a.last_date DESC
        `);
        console.log('Query result:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching attrition records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new attrition record
router.post('/attrition', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { employee_id, reason_for_leaving, reason_details, last_date, year, month } = req.body;

        // Validate required fields
        if (!employee_id || !reason_for_leaving || !last_date || !year || !month) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Validate month range
        if (month < 1 || month > 12) {
            res.status(400).json({ error: 'Invalid month value' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO hr_attrition 
            (employee_id, reason_for_leaving, reason_details, last_date, year, month)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [employee_id, reason_for_leaving, reason_details, last_date, year, month]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating attrition record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update attrition record
router.put('/attrition/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { employee_id, reason_for_leaving, reason_details, last_date, year, month } = req.body;

        // Validate required fields
        if (!employee_id || !reason_for_leaving || !last_date || !year || !month) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Validate month range
        if (month < 1 || month > 12) {
            res.status(400).json({ error: 'Invalid month value' });
            return;
        }

        // Check if the attrition record exists
        const checkResult = await pool.query(
            'SELECT * FROM hr_attrition WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Attrition record not found' });
            return;
        }

        // Update the attrition record
        const result = await pool.query(
            `UPDATE hr_attrition 
            SET employee_id = $1,
                reason_for_leaving = $2,
                reason_details = $3,
                last_date = $4,
                year = $5,
                month = $6
            WHERE id = $7
            RETURNING *`,
            [employee_id, reason_for_leaving, reason_details, last_date, year, month, id]
        );

        // Fetch the complete attrition record with employee name
        const completeResult = await pool.query(`
            SELECT a.*, e.employee_name
            FROM hr_attrition a
            JOIN hr_employees e ON a.employee_id = e.employee_id
            WHERE a.id = $1
        `, [id]);

        res.json(completeResult.rows[0]);
    } catch (error) {
        console.error('Error updating attrition record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update promotion
router.put('/promotions/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { employee_id, to_designation_id, effective_date, remarks, level } = req.body;

        // Validate required fields
        if (!employee_id || !to_designation_id || !effective_date || !level) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get employee details including initial designation
            const employeeResult = await client.query(
                'SELECT designation_id, initial_designation_id FROM hr_employees WHERE employee_id = $1',
                [employee_id]
            );

            if (employeeResult.rows.length === 0) {
                res.status(404).json({ error: 'Employee not found' });
                return;
            }

            // Get all promotions for this employee ordered by date
            const allPromotions = await client.query(
                `SELECT * FROM hr_employee_promotions 
                WHERE employee_id = $1 
                ORDER BY effective_date ASC`,
                [employee_id]
            );

            if (allPromotions.rows.length === 0) {
                res.status(404).json({ error: 'No promotion records found' });
                return;
            }

            // Find the index of the promotion being updated
            const currentIndex = allPromotions.rows.findIndex(p => p.id === parseInt(id));
            if (currentIndex === -1) {
                res.status(404).json({ error: 'Promotion record not found' });
                return;
            }

            const newDate = new Date(effective_date);

            // Check if the new date maintains chronological order
            if (currentIndex > 0) {
                const previousDate = new Date(allPromotions.rows[currentIndex - 1].effective_date);
                if (newDate <= previousDate) {
                    res.status(400).json({ 
                        error: 'Promotion date must be after the previous promotion date' 
                    });
                    return;
                }
            }

            if (currentIndex < allPromotions.rows.length - 1) {
                const nextDate = new Date(allPromotions.rows[currentIndex + 1].effective_date);
                if (newDate >= nextDate) {
                    res.status(400).json({ 
                        error: 'Promotion date must be before the next promotion date' 
                    });
                    return;
                }
            }

            // Determine from_designation_id based on position in sequence
            let from_designation_id;
            if (currentIndex > 0) {
                // If not the first promotion, get from_designation_id from previous promotion's to_designation_id
                from_designation_id = allPromotions.rows[currentIndex - 1].to_designation_id;
            } else {
                // For first promotion, use initial_designation_id
                from_designation_id = employeeResult.rows[0].initial_designation_id;
            }

            // Update the promotion record
            const result = await client.query(
                `UPDATE hr_employee_promotions 
                SET to_designation_id = $1, 
                    from_designation_id = $2,
                    effective_date = $3, 
                    remarks = $4, 
                    level = $5
                WHERE id = $6
                RETURNING *`,
                [to_designation_id, from_designation_id, effective_date, remarks, level, id]
            );

            // If there are subsequent promotions, update their from_designation_id
            if (currentIndex < allPromotions.rows.length - 1) {
                await client.query(
                    `UPDATE hr_employee_promotions 
                    SET from_designation_id = $1
                    WHERE employee_id = $2 
                    AND effective_date > $3
                    AND id = (
                        SELECT id FROM hr_employee_promotions 
                        WHERE employee_id = $2 
                        AND effective_date > $3 
                        ORDER BY effective_date ASC 
                        LIMIT 1
                    )`,
                    [to_designation_id, employee_id, effective_date]
                );
            }

            // If this is the latest promotion, update employee's current designation
            if (currentIndex === allPromotions.rows.length - 1) {
                await client.query(
                    `UPDATE hr_employees 
                    SET designation_id = $1, level = $2
                    WHERE employee_id = $3`,
                    [to_designation_id, level, employee_id]
                );
            }

            await client.query('COMMIT');

            // Fetch the complete promotion record with employee and designation names
            const completeResult = await pool.query(`
                SELECT 
                    p.*,
                    e.employee_name,
                    d_from.designation as old_designation,
                    d_to.designation as new_designation
                FROM hr_employee_promotions p
                JOIN hr_employees e ON p.employee_id = e.employee_id
                LEFT JOIN hr_designations d_from ON p.from_designation_id = d_from.designation_id
                JOIN hr_designations d_to ON p.to_designation_id = d_to.designation_id
                WHERE p.id = $1
            `, [id]);

            res.json(completeResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update transfer
router.put('/transfers/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { employee_id, to_group_id, transfer_date, remarks } = req.body;

        // Validate required fields
        if (!employee_id || !to_group_id || !transfer_date) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // First check if the transfer exists
            const checkResult = await client.query(
                'SELECT * FROM hr_group_transfer_history WHERE id = $1',
                [id]
            );

            if (checkResult.rows.length === 0) {
                res.status(404).json({ error: 'Transfer record not found' });
                return;
            }

            // Keep the original from_group_id
            const from_group_id = checkResult.rows[0].from_group_id;

            // Update the transfer record
            const result = await client.query(
                `UPDATE hr_group_transfer_history 
                SET to_group_id = $1, 
                    transfer_date = $2, 
                    remarks = $3
                WHERE id = $4
                RETURNING *`,
                [to_group_id, transfer_date, remarks, id]
            );

            // Update employee's technical group if this is their latest transfer
            const latestTransfer = await client.query(
                `SELECT id FROM hr_group_transfer_history 
                WHERE employee_id = $1 
                ORDER BY transfer_date DESC 
                LIMIT 1`,
                [employee_id]
            );

            if (latestTransfer.rows[0].id === parseInt(id)) {
                await client.query(
                    `UPDATE hr_employees 
                    SET technical_group_id = $1
                    WHERE employee_id = $2`,
                    [to_group_id, employee_id]
                );
            }

            await client.query('COMMIT');

            // Fetch the complete transfer record with employee and group names
            const completeResult = await pool.query(`
                SELECT t.*, 
                       e.employee_name,
                       g1.group_name as from_group_name,
                       g2.group_name as to_group_name
                FROM hr_group_transfer_history t
                JOIN hr_employees e ON t.employee_id = e.employee_id
                LEFT JOIN technical_groups g1 ON t.from_group_id = g1.group_id
                JOIN technical_groups g2 ON t.to_group_id = g2.group_id
                WHERE t.id = $1
            `, [id]);

            res.json(completeResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all trainings
router.get('/trainings', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /trainings ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'hr_training'
            );
        `);
        console.log('Table check result:', tableExists.rows[0]);

        if (!tableExists.rows[0].exists) {
            console.log('Training table does not exist');
            res.status(404).json({ error: 'Training table does not exist' });
            return;
        }

        const result = await pool.query(`
            SELECT * FROM hr_training
            ORDER BY start_date DESC
        `);
        
        console.log('Query result:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching trainings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new training
router.post('/trainings', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { 
            training_type,
            training_topic,
            start_date,
            end_date,
            venue,
            attended_count,
            training_mode,
            guest_lecture_name,
            lecturer_details
        } = req.body;

        // Validate required fields
        if (!training_type || !training_topic || !start_date || !end_date || !attended_count || !training_mode || !guest_lecture_name || !lecturer_details) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Validate training_type
        const validTrainingTypes = ['TECHNICAL', 'MENTAL_HEALTH', 'SPECIAL_TECHNICAL_TRAINING', 'WORK_LIFE_BALANCE'];
        if (!validTrainingTypes.includes(training_type)) {
            res.status(400).json({ error: 'Invalid training type' });
            return;
        }

        // Validate attended_count
        if (attended_count < 0) {
            res.status(400).json({ error: 'Attended count must be non-negative' });
            return;
        }

        // Validate dates
        if (new Date(end_date) < new Date(start_date)) {
            res.status(400).json({ error: 'End date must be after start date' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO hr_training 
            (training_type, training_topic, start_date, end_date, venue, attended_count, training_mode, guest_lecture_name, lecturer_details)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [training_type, training_topic, start_date, end_date, venue, attended_count, training_mode, guest_lecture_name, lecturer_details]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating training:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update training
router.put('/trainings/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { 
            training_type,
            training_topic,
            start_date,
            end_date,
            venue,
            attended_count,
            training_mode,
            guest_lecture_name,
            lecturer_details
        } = req.body;

        // Validate required fields
        if (!training_type || !training_topic || !start_date || !end_date || !attended_count || !training_mode || !guest_lecture_name || !lecturer_details) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Validate training_type
        const validTrainingTypes = ['TECHNICAL', 'MENTAL_HEALTH', 'SPECIAL_TECHNICAL_TRAINING', 'WORK_LIFE_BALANCE'];
        if (!validTrainingTypes.includes(training_type)) {
            res.status(400).json({ error: 'Invalid training type' });
            return;
        }

        // Validate attended_count
        if (attended_count < 0) {
            res.status(400).json({ error: 'Attended count must be non-negative' });
            return;
        }

        // Validate dates
        if (new Date(end_date) < new Date(start_date)) {
            res.status(400).json({ error: 'End date must be after start date' });
            return;
        }

        const result = await pool.query(
            `UPDATE hr_training 
            SET training_type = $1,
                training_topic = $2,
                start_date = $3,
                end_date = $4,
                venue = $5,
                attended_count = $6,
                training_mode = $7,
                guest_lecture_name = $8,
                lecturer_details = $9
            WHERE id = $10
            RETURNING *`,
            [training_type, training_topic, start_date, end_date, venue, attended_count, training_mode, guest_lecture_name, lecturer_details, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Training record not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating training:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete training
router.delete('/trainings/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if the training record exists
        const checkResult = await pool.query(
            'SELECT * FROM hr_training WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Training record not found' });
            return;
        }

        // Delete the training record
        await pool.query(
            'DELETE FROM hr_training WHERE id = $1',
            [id]
        );

        res.json({ message: 'Training record deleted successfully' });
    } catch (error) {
        console.error('Error deleting training:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all recruitments
router.get('/recruitments', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('=== GET /recruitments ===');
        console.log('User:', req.user);
        console.log('Auth token:', req.headers.authorization);

        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'hr_recruitment'
            );
        `);
        console.log('Table check result:', tableExists.rows[0]);

        if (!tableExists.rows[0].exists) {
            console.log('Recruitment table does not exist');
            res.status(404).json({ error: 'Recruitment table does not exist' });
            return;
        }

        const result = await pool.query(`
            SELECT * FROM hr_recruitment
            ORDER BY year DESC, month DESC
        `);
        
        console.log('Query result:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching recruitments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new recruitment
router.post('/recruitments', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { 
            recruitment_mode,
            year,
            month,
            recruited_count
        } = req.body;

        // Validate required fields
        if (!recruitment_mode || !year || !month || recruited_count === undefined) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Validate recruitment_mode
        const validModes = ['ACTS', 'OFF_CAMPUS', 'OPEN_AD'];
        if (!validModes.includes(recruitment_mode)) {
            res.status(400).json({ error: 'Invalid recruitment mode' });
            return;
        }

        // Validate year
        if (year < 2000) {
            res.status(400).json({ error: 'Year must be 2000 or later' });
            return;
        }

        // Validate month
        if (month < 1 || month > 12) {
            res.status(400).json({ error: 'Month must be between 1 and 12' });
            return;
        }

        // Validate recruited_count
        if (recruited_count < 0) {
            res.status(400).json({ error: 'Recruited count must be non-negative' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO hr_recruitment 
            (recruitment_mode, year, month, recruited_count)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [recruitment_mode, year, month, recruited_count]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating recruitment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update recruitment
router.put('/recruitments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { 
            recruitment_mode,
            year,
            month,
            recruited_count
        } = req.body;

        // Validate required fields
        if (!recruitment_mode || !year || !month || recruited_count === undefined) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Validate recruitment_mode
        const validModes = ['ACTS', 'OFF_CAMPUS', 'OPEN_AD'];
        if (!validModes.includes(recruitment_mode)) {
            res.status(400).json({ error: 'Invalid recruitment mode' });
            return;
        }

        // Validate year
        if (year < 2000) {
            res.status(400).json({ error: 'Year must be 2000 or later' });
            return;
        }

        // Validate month
        if (month < 1 || month > 12) {
            res.status(400).json({ error: 'Month must be between 1 and 12' });
            return;
        }

        // Validate recruited_count
        if (recruited_count < 0) {
            res.status(400).json({ error: 'Recruited count must be non-negative' });
            return;
        }

        // Check if the recruitment record exists
        const checkResult = await pool.query(
            'SELECT * FROM hr_recruitment WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Recruitment record not found' });
            return;
        }

        const result = await pool.query(
            `UPDATE hr_recruitment 
            SET recruitment_mode = $1,
                year = $2,
                month = $3,
                recruited_count = $4
            WHERE id = $5
            RETURNING *`,
            [recruitment_mode, year, month, recruited_count, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating recruitment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete recruitment
router.delete('/recruitments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if the recruitment record exists
        const checkResult = await pool.query(
            'SELECT * FROM hr_recruitment WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Recruitment record not found' });
            return;
        }

        // Delete the recruitment record
        await pool.query(
            'DELETE FROM hr_recruitment WHERE id = $1',
            [id]
        );

        res.json({ message: 'Recruitment record deleted successfully' });
    } catch (error) {
        console.error('Error deleting recruitment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all contract renewals
router.get('/contracts', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const result = await pool.query(`
            SELECT c.*, e.employee_name 
            FROM hr_contract_renewals c
            JOIN hr_employees e ON c.employee_id = e.employee_id
            ORDER BY c.start_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
});

// Create new contract renewal
router.post('/contracts', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { employee_id, contract_type, start_date, end_date, duration_months, remarks } = req.body;
        
        const result = await pool.query(`
            INSERT INTO hr_contract_renewals 
            (employee_id, contract_type, start_date, end_date, duration_months, remarks)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [employee_id, contract_type, start_date, end_date, duration_months, remarks]);

        const contract = result.rows[0];
        const employeeResult = await pool.query(`
            SELECT employee_name 
            FROM hr_employees 
            WHERE employee_id = $1
        `, [employee_id]);
        
        res.status(201).json({
            ...contract,
            employee_name: employeeResult.rows[0].employee_name
        });
    } catch (error) {
        console.error('Error creating contract:', error);
        res.status(500).json({ error: 'Failed to create contract' });
    }
});

// Update contract renewal
router.put('/contracts/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { employee_id, contract_type, start_date, end_date, duration_months, remarks } = req.body;
        
        const result = await pool.query(`
            UPDATE hr_contract_renewals 
            SET employee_id = $1, 
                contract_type = $2, 
                start_date = $3, 
                end_date = $4, 
                duration_months = $5, 
                remarks = $6
            WHERE id = $7
            RETURNING *
        `, [employee_id, contract_type, start_date, end_date, duration_months, remarks, id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }

        const contract = result.rows[0];
        const employeeResult = await pool.query(`
            SELECT employee_name 
            FROM hr_employees 
            WHERE employee_id = $1
        `, [employee_id]);
        
        res.json({
            ...contract,
            employee_name: employeeResult.rows[0].employee_name
        });
    } catch (error) {
        console.error('Error updating contract:', error);
        res.status(500).json({ error: 'Failed to update contract' });
    }
});

// Delete contract renewal
router.delete('/contracts/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            DELETE FROM hr_contract_renewals 
            WHERE id = $1 
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }
        
        res.json({ message: 'Contract deleted successfully' });
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: 'Failed to delete contract' });
    }
});

// Delete promotion
router.delete('/promotions/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if the promotion record exists
        const checkResult = await pool.query(
            'SELECT * FROM hr_employee_promotions WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Promotion record not found' });
            return;
        }

        // Delete the promotion record
        await pool.query(
            'DELETE FROM hr_employee_promotions WHERE id = $1',
            [id]
        );

        res.json({ message: 'Promotion record deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add these endpoints after the existing promotion endpoints
router.post('/validate-promotions', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { promotions } = req.body;
        const errors: string[] = [];
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Validate employee existence and get their current designations
            for (const [index, promotion] of promotions.entries()) {
                // Check if employee exists
                const employeeResult = await client.query(
                    'SELECT e.*, d.designation_name FROM hr_employees e JOIN hr_designations d ON e.designation_id = d.id WHERE e.employee_id = $1',
                    [promotion.employee_id]
                );

                if (employeeResult.rows.length === 0) {
                    errors.push(`Row ${index + 1}: Employee ID ${promotion.employee_id} does not exist`);
                    continue;
                }

                const employee = employeeResult.rows[0];

                // Check if promotion date is after join date
                if (new Date(promotion.effective_date) < new Date(employee.join_date)) {
                    errors.push(`Row ${index + 1}: Promotion date cannot be before employee join date for employee ${promotion.employee_id}`);
                }

                // Check if designation exists
                const designationResult = await client.query(
                    'SELECT * FROM hr_designations WHERE id = $1',
                    [promotion.to_designation_id]
                );

                if (designationResult.rows.length === 0) {
                    errors.push(`Row ${index + 1}: Invalid designation ID ${promotion.to_designation_id}`);
                }

                // Validate designation progression
                const currentDesignation = employee.designation_id;
                if (promotion.to_designation_id < currentDesignation) {
                    errors.push(`Row ${index + 1}: Cannot demote employee ${promotion.employee_id} from ${employee.designation_name}`);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        res.json({ errors });
    } catch (error) {
        console.error('Error validating promotions:', error);
        res.status(500).json({ error: 'Internal server error', errors: ['Failed to validate promotions'] });
    }
});

router.post('/import-promotions', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { promotions } = req.body;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const promotion of promotions) {
                // Get employee's current designation
                const employeeResult = await client.query(
                    'SELECT designation_id FROM hr_employees WHERE employee_id = $1',
                    [promotion.employee_id]
                );

                const from_designation_id = employeeResult.rows[0].designation_id;

                // Insert promotion record
                await client.query(
                    `INSERT INTO hr_employee_promotions 
                    (employee_id, effective_date, from_designation_id, to_designation_id, level, remarks)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        promotion.employee_id,
                        promotion.effective_date,
                        from_designation_id,
                        promotion.to_designation_id,
                        promotion.level,
                        promotion.remarks || null
                    ]
                );

                // Update employee's current designation
                await client.query(
                    'UPDATE hr_employees SET designation_id = $1 WHERE employee_id = $2',
                    [promotion.to_designation_id, promotion.employee_id]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Promotions imported successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error importing promotions:', error);
        res.status(500).json({ error: 'Failed to import promotions' });
    }
});

export default router; 