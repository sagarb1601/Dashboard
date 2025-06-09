import express, { Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import multer from 'multer';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

        const { employee_id } = req.query;
        let query = `
            SELECT 
                p.*,
                e.employee_name,
                d_from.designation as old_designation,
                d_to.designation as new_designation
            FROM hr_employee_promotions p
            JOIN hr_employees e ON p.employee_id = e.employee_id
            JOIN hr_designations d_from ON p.from_designation_id = d_from.designation_id
            JOIN hr_designations d_to ON p.to_designation_id = d_to.designation_id
        `;

        const queryParams: any[] = [];
        if (employee_id) {
            query += ' WHERE p.employee_id = $1';
            queryParams.push(employee_id);
        }

        query += ' ORDER BY p.effective_date DESC';
        
        const result = await pool.query(query, queryParams);
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

            // Get employee details including initial designation
            const employeeResult = await client.query(
                'SELECT designation_id, initial_designation_id FROM hr_employees WHERE employee_id = $1',
                [employee_id]
            );

            if (employeeResult.rows.length === 0) {
                res.status(404).json({ error: 'Employee not found' });
                return;
            }

            // Check if there are any existing promotions for this employee
            const existingPromotions = await client.query(
                `SELECT * FROM hr_employee_promotions 
                WHERE employee_id = $1 
                ORDER BY effective_date ASC`,
                [employee_id]
            );

            let from_designation_id;

            if (existingPromotions.rows.length === 0) {
                // For first promotion, use initial_designation_id
                from_designation_id = employeeResult.rows[0].initial_designation_id;
            } else {
                // For subsequent promotions, use the to_designation_id of the latest promotion
                const latestPromotion = existingPromotions.rows[existingPromotions.rows.length - 1];
                from_designation_id = latestPromotion.to_designation_id;

                // Check if the new promotion date is after the latest promotion
                if (new Date(effective_date) <= new Date(latestPromotion.effective_date)) {
                    res.status(400).json({ error: 'New promotion date must be after the latest promotion' });
                    return;
                }
            }

            // Create the promotion record
            const result = await client.query(
                `INSERT INTO hr_employee_promotions 
                (employee_id, from_designation_id, to_designation_id, effective_date, remarks, level)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [employee_id, from_designation_id, to_designation_id, effective_date, remarks, level]
            );

            // Update employee's current designation
            await client.query(
                'UPDATE hr_employees SET designation_id = $1 WHERE employee_id = $2',
                [to_designation_id, employee_id]
            );

            await client.query('COMMIT');

            // Fetch complete promotion data with joined tables
            const completePromotion = await pool.query(`
                SELECT p.*,
                       e.employee_name,
                       fd.designation as from_designation,
                       fd.designation_full as from_designation_full,
                       td.designation as to_designation,
                       td.designation_full as to_designation_full
                FROM hr_employee_promotions p
                JOIN hr_employees e ON p.employee_id = e.employee_id
                LEFT JOIN hr_designations fd ON p.from_designation_id = fd.designation_id
                LEFT JOIN hr_designations td ON p.to_designation_id = td.designation_id
                WHERE p.id = $1
            `, [result.rows[0].id]);

            res.status(201).json(completePromotion.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ 
            error: 'Error creating promotion', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Get promotion template
router.get('/promotions/template', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Create workbook
        const workbook = XLSX.utils.book_new();
        
        // Create worksheet data
        const wsData = [
            ['Employee ID*', 'Effective Date* (YYYY-MM-DD)', 'To Designation ID*', 'Level*', 'Remarks'],
            ['102345', '2024-03-15', '7', '13', 'Sample promotion']
        ];
        
        // Convert data to worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Promotion Template');
        
        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="promotion_template.xlsx"');
        
        // Send the Excel file
        res.send(buffer);
    } catch (error) {
        console.error('Error generating promotion template:', error);
        res.status(500).json({ error: 'Failed to generate promotion template' });
    }
});

interface PromotionImportRow {
    'Employee ID*': number;
    'Effective Date* (YYYY-MM-DD)': number;
    'To Designation ID*': number;
    'Level*': number;
    'Remarks'?: string;
}

// Convert Excel date number to JavaScript Date
function excelDateToJSDate(excelDate: number): Date {
    // Excel's epoch starts from 1900-01-01
    const daysToSubtract = excelDate > 59 ? 1 : 0; // Excel incorrectly considers 1900 as a leap year
    const adjustedDate = excelDate - daysToSubtract;
    
    // Calculate year, month, and day
    let year = 1900;
    let remainingDays = adjustedDate - 1; // Subtract 1 because Excel starts from 1/1/1900
    
    // Calculate the year
    while (remainingDays >= (isLeapYear(year) ? 366 : 365)) {
        remainingDays -= isLeapYear(year) ? 366 : 365;
        year++;
    }
    
    // Calculate the month
    const monthDays = isLeapYear(year) ? DAYS_IN_MONTH_LEAP : DAYS_IN_MONTH;
    let month = 0;
    while (remainingDays >= monthDays[month]) {
        remainingDays -= monthDays[month];
        month++;
    }
    
    // The remaining days plus 1 is the day of the month
    const day = Math.floor(remainingDays) + 1;
    
    // Create date using local time and set to start of day
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date;
}

// Helper function to check if a year is a leap year
function isLeapYear(year: number): boolean {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// Days in each month (non-leap year)
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_IN_MONTH_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Bulk import promotions
router.post('/promotions/bulk', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    console.log('=== POST /promotions/bulk ===');
    console.log('Processing file:', req.file.originalname);

    const client = await pool.connect();
    let batchUploadId: number | undefined;

    try {
        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const promotions = XLSX.utils.sheet_to_json<PromotionImportRow>(worksheet);

        console.log('Number of promotions to process:', promotions.length);

        // Create batch upload record
        const batchResult = await client.query(
            `INSERT INTO hr_promotion_batch_uploads (
                file_name, uploaded_by, total_records, successful_records, failed_records
            ) VALUES ($1, $2, $3, 0, 0) RETURNING id`,
            [req.file.originalname, req.user.userId, promotions.length]
        );
        batchUploadId = batchResult.rows[0].id;

        // Pre-validate all employee IDs exist
        const employeeIds = [...new Set(promotions.map(p => p['Employee ID*']))];
        const employeeResult = await client.query(
            `SELECT employee_id, initial_designation_id, join_date 
             FROM hr_employees 
             WHERE employee_id = ANY($1)`,
            [employeeIds]
        );

        const validEmployeeIds = new Set(employeeResult.rows.map(r => r.employee_id));
        const invalidEmployeeIds = employeeIds.filter(id => !validEmployeeIds.has(id));

        if (invalidEmployeeIds.length > 0) {
            throw new Error(`Invalid employee IDs: ${invalidEmployeeIds.join(', ')}`);
        }

        // Group promotions by employee
        const promotionsByEmployee = promotions.reduce<Record<number, PromotionImportRow[]>>((acc, promotion) => {
            const empId = promotion['Employee ID*'];
            if (!acc[empId]) {
                acc[empId] = [];
            }
            acc[empId].push(promotion);
            return acc;
        }, {});

        const results = {
            successful: [] as Array<{ employee_id: number; promotion_id: number }>,
            failed: [] as Array<{ employee_id: number; error: string }>
        };

        // Process each employee's promotions in a separate transaction
        for (const [employeeId, employeePromotions] of Object.entries(promotionsByEmployee)) {
            const empId = Number(employeeId);
            
            try {
                await client.query('BEGIN');

                // Set current user for audit logging
                await client.query("SET LOCAL app.current_user_id = $1", [req.user.userId]);

                // Sort promotions by date
                employeePromotions.sort((a, b) => {
                    const dateA = excelDateToJSDate(Number(a['Effective Date* (YYYY-MM-DD)']));
                    const dateB = excelDateToJSDate(Number(b['Effective Date* (YYYY-MM-DD)']));
                    return dateA.getTime() - dateB.getTime();
                });

                // Process each promotion
                for (const promotion of employeePromotions) {
                    const effectiveDate = excelDateToJSDate(Number(promotion['Effective Date* (YYYY-MM-DD)']));
                    
                    // Get the previous designation
                    const prevPromotionResult = await client.query(
                        `SELECT to_designation_id 
                         FROM hr_employee_promotions 
                         WHERE employee_id = $1 
                         AND effective_date < $2
                         ORDER BY effective_date DESC 
                         LIMIT 1`,
                        [empId, effectiveDate]
                    );

                    const employee = employeeResult.rows.find(r => r.employee_id === empId);
                    if (!employee) {
                        throw new Error(`Employee ${empId} not found`);
                    }

                    const fromDesignationId = prevPromotionResult.rows.length > 0
                        ? prevPromotionResult.rows[0].to_designation_id
                        : employee.initial_designation_id;

                    // Insert the promotion
                    const result = await client.query(
                        `INSERT INTO hr_employee_promotions (
                            employee_id, from_designation_id, to_designation_id, 
                            effective_date, level, remarks
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id`,
                        [
                            empId,
                            fromDesignationId,
                            promotion['To Designation ID*'],
                            effectiveDate,
                            promotion['Level*'],
                            promotion['Remarks'] || null
                        ]
                    );

                    results.successful.push({
                        employee_id: empId,
                        promotion_id: result.rows[0].id
                    });
                }

                await client.query('COMMIT');

                // Update batch upload success count
                await client.query(
                    `UPDATE hr_promotion_batch_uploads 
                     SET successful_records = successful_records + $1 
                     WHERE id = $2`,
                    [employeePromotions.length, batchUploadId]
                );

            } catch (error) {
                await client.query('ROLLBACK');
                
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.failed.push({
                    employee_id: empId,
                    error: errorMessage
                });

                // Update batch upload failure count and error log
                await client.query(
                    `UPDATE hr_promotion_batch_uploads 
                     SET failed_records = failed_records + $1,
                         error_log = error_log || $2::jsonb
                     WHERE id = $3`,
                    [
                        employeePromotions.length,
                        JSON.stringify({ employee_id: empId, error: errorMessage }),
                        batchUploadId
                    ]
                );
            }
        }

        // Update batch upload status
        await client.query(
            `UPDATE hr_promotion_batch_uploads 
             SET status = 'COMPLETED' 
             WHERE id = $1`,
            [batchUploadId]
        );

        res.json(results);

    } catch (error) {
        // Update batch upload status to failed
        if (batchUploadId) {
            await client.query(
                `UPDATE hr_promotion_batch_uploads 
                 SET status = 'FAILED',
                 error_log = $1::jsonb
                 WHERE id = $2`,
                [JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), batchUploadId]
            );
        }

        console.error('Error in bulk import:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        client.release();
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

        // Check if attrition record already exists for this employee
        const existingRecord = await pool.query(
            'SELECT * FROM hr_attrition WHERE employee_id = $1',
            [employee_id]
        );

        if (existingRecord.rows.length > 0) {
            res.status(409).json({ 
                error: 'An attrition record already exists for this employee',
                existingRecord: existingRecord.rows[0]
            });
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
    } catch (error: any) {
        console.error('Error creating attrition record:', error);
        // Check for unique constraint violation
        if (error?.code === '23505') { // PostgreSQL unique violation code
            res.status(409).json({ 
                error: 'An attrition record already exists for this employee'
            });
            return;
        }
        // Check for check constraint violation (inactive employee)
        if (error?.code === '23514') { // PostgreSQL check violation code
            res.status(400).json({ 
                error: 'Cannot create attrition record for inactive employee'
            });
            return;
        }
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
    if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { to_designation_id, effective_date, remarks, level } = req.body;

        // Log request parameters
        console.log('Update promotion request:', {
            id,
            to_designation_id,
            effective_date,
            remarks,
            level,
            user: req.user
        });

        // Validate parameters
        if (!to_designation_id || !effective_date || !level) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Convert parameters to correct types
        const promotionId = parseInt(id, 10);
        const designationId = parseInt(to_designation_id, 10);
        const promotionLevel = parseInt(level, 10);

        if (isNaN(promotionId) || isNaN(designationId) || isNaN(promotionLevel)) {
            res.status(400).json({ error: 'Invalid parameter types' });
            return;
        }

        await client.query('BEGIN');

        // Set current user for audit logging
        await client.query('SET LOCAL app.current_user_id = $1', [req.user.userId]);

        // Get the current promotion
        const currentPromotionResult = await client.query(
            'SELECT * FROM hr_employee_promotions WHERE id = $1',
            [promotionId]
        );

        if (currentPromotionResult.rows.length === 0) {
            res.status(404).json({ error: 'Promotion not found' });
            return;
        }

        const currentPromotion = currentPromotionResult.rows[0];

        // Check if new date conflicts with other promotions
        const conflictingPromotionResult = await client.query(
            'SELECT id, effective_date FROM hr_employee_promotions WHERE employee_id = $1 AND effective_date = $2 AND id != $3',
            [currentPromotion.employee_id, effective_date, promotionId]
        );

        if (conflictingPromotionResult.rows.length > 0) {
            res.status(400).json({ 
                error: `Another promotion already exists on ${dayjs(effective_date).format('DD/MM/YYYY')}` 
            });
            return;
        }

        // Log the query parameters
        console.log('Updating promotion with parameters:', {
            effective_date,
            to_designation_id: designationId,
            level: promotionLevel,
            remarks,
            id: promotionId
        });

        // Update the promotion with proper parameter binding
        const updateResult = await client.query(
            `UPDATE hr_employee_promotions 
             SET effective_date = $1,
                 to_designation_id = $2,
                 level = $3,
                 remarks = $4
             WHERE id = $5
             RETURNING *`,
            [effective_date, designationId, promotionLevel, remarks || null, promotionId]
        );

        if (updateResult.rows.length === 0) {
            throw new Error('Failed to update promotion');
        }

        console.log('Successfully updated promotion:', updateResult.rows[0]);

        await client.query('COMMIT');
        res.json({ 
            success: true,
            message: 'Promotion updated successfully',
            promotion: updateResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating promotion:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        client.release();
    }
});

// Delete promotion
router.delete('/promotions/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Set current user for audit logging
        await client.query("SET LOCAL app.current_user_id = $1", [req.user.userId]);

        // Get the promotion to delete
        const promotionResult = await client.query(
            'SELECT * FROM hr_employee_promotions WHERE id = $1',
            [id]
        );

        if (promotionResult.rows.length === 0) {
            res.status(404).json({ error: 'Promotion not found' });
            return;
        }

        const promotion = promotionResult.rows[0];

        // Get surrounding promotions
        const surroundingPromotions = await client.query(
            `SELECT id, effective_date, from_designation_id, to_designation_id, level
             FROM hr_employee_promotions 
             WHERE employee_id = $1 
             AND id != $2
             ORDER BY effective_date`,
            [promotion.employee_id, id]
        );

        const promotions = surroundingPromotions.rows;
        const deletingIndex = promotions.findIndex(p => 
            new Date(p.effective_date) > new Date(promotion.effective_date)
        );

        // If this is not the latest promotion, update the from_designation_id of the next promotion
        if (deletingIndex < promotions.length) {
            const nextPromotion = promotions[deletingIndex];
            const newFromDesignationId = deletingIndex > 0 
                ? promotions[deletingIndex - 1].to_designation_id
                : (await client.query(
                    'SELECT initial_designation_id FROM hr_employees WHERE employee_id = $1',
                    [promotion.employee_id]
                )).rows[0].initial_designation_id;

            await client.query(
                `UPDATE hr_employee_promotions 
                 SET from_designation_id = $1
                 WHERE id = $2`,
                [newFromDesignationId, nextPromotion.id]
            );
        }

        // Delete the promotion
        await client.query('DELETE FROM hr_employee_promotions WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: 'Promotion deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting promotion:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        client.release();
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
    } catch (error: any) {
        console.error('Error creating contract:', error);
        if (error.message?.includes('Contract dates overlap')) {
            res.status(409).json({ 
                error: 'Contract dates overlap with an existing contract for this employee. Please choose different dates.'
            });
            return;
        }
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
    } catch (error: any) {
        console.error('Error updating contract:', error);
        if (error.message?.includes('Contract dates overlap')) {
            res.status(409).json({ 
                error: 'Contract dates overlap with an existing contract for this employee. Please choose different dates.'
            });
            return;
        }
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

// Delete attrition record
router.delete('/attrition/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if the attrition record exists
        const checkResult = await pool.query(
            'SELECT * FROM hr_attrition WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Attrition record not found' });
            return;
        }

        // Delete the attrition record
        await pool.query(
            'DELETE FROM hr_attrition WHERE id = $1',
            [id]
        );

        res.json({ message: 'Attrition record deleted successfully' });
    } catch (error) {
        console.error('Error deleting attrition record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 