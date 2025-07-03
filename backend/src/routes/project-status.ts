import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import ExcelJS from 'exceljs';

const router = Router();

// Get project status for a specific month (with project details)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, group_id: queryGroupId } = req.query;
    const user = (req as any).user;
    let group_id = queryGroupId;
    // For TG users, always use their own group_id
    if (user && user.role === 'tg') {
      group_id = user.group_id;
    }

    console.log('GET /project-status - Fetching project status');
    console.log('Query params:', { month, group_id });
    console.log('User:', user);

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by month if provided - show all projects regardless of end date for status tracking
    if (month) {
      whereClause += ` WHERE fp.start_date <= $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    // Filter by group_id if provided (for TG users)
    if (group_id && group_id !== 'undefined' && group_id !== '') {
      const operator = whereClause ? 'AND' : 'WHERE';
      whereClause += ` ${operator} fp.group_id = $${paramIndex}`;
      params.push(group_id);
      paramIndex++;
    }

    const query = `
      SELECT 
        fp.project_id as project_id,
        fp.project_name,
        fp.start_date,
        fp.end_date,
        fp.funding_agency,
        fp.centre,
        fp.project_investigator_id,
        he.employee_name as pi_name,
        pms.status,
        pms.remarks,
        pms.month,
        pms.last_updated_on
      FROM finance_projects fp
      LEFT JOIN hr_employees he ON fp.project_investigator_id = he.employee_id
      LEFT JOIN project_monthly_status pms ON fp.project_id = pms.project_id 
        AND pms.month = $${paramIndex}
      ${whereClause}
      ORDER BY fp.project_name
    `;

    // Add the month parameter for the LEFT JOIN
    params.push(month || new Date().toISOString().slice(0, 7) + '-01');

    console.log('SQL Query:', query);
    console.log('Query parameters:', params);

    const result = await pool.query(query, params);

    const data = result.rows.map(row => ({
      project_id: row.project_id,
      project_name: row.project_name,
      start_date: row.start_date,
      end_date: row.end_date,
      funding_agency: row.funding_agency,
      centre: row.centre,
      project_investigator_id: row.project_investigator_id,
      pi_name: row.pi_name,
      status: row.status || null,
      remarks: row.remarks || '',
      month: row.month,
      last_updated_on: row.last_updated_on
    }));

    console.log('Project status data:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching project status:', error);
    res.status(500).json({ error: 'Failed to fetch project status' });
  }
});

// Create or update project status
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { project_id, status, remarks, month } = req.body;
    const user = (req as any).user;

    console.log('POST /project-status - Creating/updating project status');
    console.log('Request body:', { project_id, status, remarks, month });
    console.log('User:', user);

    if (!project_id || !status || !month) {
      res.status(400).json({ error: 'project_id, status, and month are required' });
      return;
    }

    if (!['RED', 'YELLOW', 'GREEN'].includes(status)) {
      res.status(400).json({ error: 'Status must be RED, YELLOW, or GREEN' });
      return;
    }

    // Use upsert (INSERT ... ON CONFLICT UPDATE)
    const query = `
      INSERT INTO project_monthly_status (project_id, status, remarks, month)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (project_id, month) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        remarks = EXCLUDED.remarks,
        last_updated_on = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [project_id, status, remarks, month]);

    console.log('Project status saved:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving project status:', error);
    res.status(500).json({ error: 'Failed to save project status' });
  }
});

// Get project status history
router.get('/:projectId/history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { limit = 12 } = req.query; // Default to last 12 months

    console.log('GET /project-status/:projectId/history - Fetching project status history');
    console.log('Project ID:', projectId);
    console.log('Limit:', limit);

    const query = `
      SELECT 
        pms.status,
        pms.remarks,
        pms.month,
        pms.last_updated_on
      FROM project_monthly_status pms
      WHERE pms.project_id = $1
      ORDER BY pms.month DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [projectId, limit]);

    const data = result.rows.map(row => ({
      status: row.status,
      remarks: row.remarks,
      month: row.month,
      last_updated_on: row.last_updated_on
    }));

    console.log('Project status history:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching project status history:', error);
    res.status(500).json({ error: 'Failed to fetch project status history' });
  }
});

// Get all projects (for existing TG modules)
router.get('/projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /project-status/projects - Fetching all projects for TG modules');

    const query = `
      SELECT 
        fp.project_id as id,
        fp.project_name,
        fp.start_date,
        fp.end_date,
        fp.funding_agency,
        fp.centre,
        fp.project_investigator_id,
        he.employee_name as pi_name,
        fp.group_id
      FROM finance_projects fp
      LEFT JOIN hr_employees he ON fp.project_investigator_id = he.employee_id
      ORDER BY fp.project_name
    `;

    const result = await pool.query(query);

    const data = result.rows.map(row => ({
      id: row.id,
      project_name: row.project_name,
      start_date: row.start_date,
      end_date: row.end_date,
      funding_agency: row.funding_agency,
      centre: row.centre,
      project_investigator_id: row.project_investigator_id,
      pi_name: row.pi_name,
      group_id: row.group_id
    }));

    console.log('Projects data for TG modules:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching projects for TG modules:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get all employees (for existing TG modules)
router.get('/employees', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /project-status/employees - Fetching all employees for TG modules');

    const query = `
      SELECT 
        employee_id,
        employee_name,
        designation_id,
        centre
      FROM hr_employees
      ORDER BY employee_name
    `;

    const result = await pool.query(query);

    const data = result.rows.map(row => ({
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      designation: row.designation_id,
      centre: row.centre
    }));

    console.log('Employees data for TG modules:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching employees for TG modules:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get project status matrix for multiple months
router.get('/matrix', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    let { months, group_id: queryGroupId } = req.query;
    const user = (req as any).user;
    let group_id = queryGroupId;
    if (user && user.role === 'tg') {
      group_id = user.group_id;
    }

    console.log('GET /project-status/matrix - Fetching project status matrix');
    console.log('Query params:', { months, group_id });
    console.log('User:', user);

    if (!months) {
      res.status(400).json({ error: 'months query param required (comma-separated YYYY-MM)' });
      return;
    }
    if (typeof months === 'string') {
      months = months.split(',');
    }
    if (!Array.isArray(months)) {
      res.status(400).json({ error: 'months must be an array or comma-separated string' });
      return;
    }

    // Use YYYY-MM format for comparison
    const monthStrings = (months as string[]).map(m => m.trim());
    console.log('Month strings for query:', monthStrings);

    // Build WHERE clause for projects
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by group_id if provided (for TG users)
    if (group_id && group_id !== 'undefined' && group_id !== '') {
      whereClause += ` WHERE fp.group_id = $${paramIndex}`;
      params.push(group_id);
      paramIndex++;
    }

    // Get all projects (order by project_name)
    const projectsQuery = `
      SELECT 
        fp.project_id,
        fp.project_name,
        fp.start_date,
        fp.end_date,
        fp.funding_agency,
        fp.centre,
        fp.project_investigator_id,
        he.employee_name as pi_name
      FROM finance_projects fp
      LEFT JOIN hr_employees he ON fp.project_investigator_id = he.employee_id
      ${whereClause}
      ORDER BY fp.project_name
    `;

    console.log('Projects query:', projectsQuery);
    console.log('Projects query params:', params);

    const projectsResult = await pool.query(projectsQuery, params);
    const projects = projectsResult.rows;
    console.log('Found projects:', projects.length);

    // Get all statuses for these projects and months
    const statusQuery = `
      SELECT 
        pms.project_id, pms.status, pms.remarks, pms.month, pms.last_updated_on
      FROM project_monthly_status pms
      JOIN finance_projects fp ON pms.project_id = fp.project_id
      WHERE to_char(pms.month, 'YYYY-MM') = ANY($1)
      ${group_id && group_id !== 'undefined' && group_id !== '' ? 'AND fp.group_id = $2' : ''}
    `;

    console.log('Status query:', statusQuery);
    console.log('Status query params:', group_id && group_id !== 'undefined' && group_id !== '' ? [monthStrings, group_id] : [monthStrings]);

    const statusResult = await pool.query(statusQuery, group_id && group_id !== 'undefined' && group_id !== '' ? [monthStrings, group_id] : [monthStrings]);
    console.log('Found status records:', statusResult.rows.length);

    // Build a map: { [project_id]: { [YYYY-MM]: {status, remarks, last_updated_on} } }
    const statusMap: Record<number, Record<string, any>> = {};
    statusResult.rows.forEach(row => {
      const monthKey = row.month.toISOString().slice(0, 7); // YYYY-MM
      if (!statusMap[row.project_id]) statusMap[row.project_id] = {};
      statusMap[row.project_id][monthKey] = {
        status: row.status,
        remarks: row.remarks,
        last_updated_on: row.last_updated_on
      };
    });

    console.log('Status map:', statusMap);

    // Build response
    let data = projects.map(proj => {
      const statuses: Record<string, any> = {};
      (months as string[]).forEach(m => {
        statuses[m] = statusMap[proj.project_id]?.[m] || null;
      });
      return {
        project_id: proj.project_id,
        project_name: proj.project_name,
        pi_name: proj.pi_name,
        centre: proj.centre,
        funding_agency: proj.funding_agency,
        start_date: proj.start_date,
        end_date: proj.end_date,
        statuses
      };
    });

    console.log('Data before filtering:', data.length, 'projects');
    console.log('Sample project data before filtering:', data[0]);

    // Filter: only include projects with at least one status in the selected months
    data = data.filter(project => {
      const hasStatus = Object.values(project.statuses).some(cell => cell && cell.status);
      console.log(`Project ${project.project_id} (${project.project_name}): hasStatus = ${hasStatus}`);
      console.log(`  Statuses:`, project.statuses);
      return hasStatus;
    });

    console.log('Data after filtering:', data.length, 'projects');
    console.log('Final matrix data:', data);

    res.json(data);
  } catch (error) {
    console.error('Error fetching project status matrix:', error);
    res.status(500).json({ error: 'Failed to fetch project status matrix' });
  }
});

// Export project status as CSV for a given month
router.get('/export', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, group_id } = req.query;
    const user = (req as any).user;

    // Use the same query as the main project status endpoint
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (month) {
      whereClause += ` WHERE fp.start_date <= $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }
    if (group_id && group_id !== 'undefined' && group_id !== '') {
      const operator = whereClause ? 'AND' : 'WHERE';
      whereClause += ` ${operator} fp.group_id = $${paramIndex}`;
      params.push(group_id);
      paramIndex++;
    }

    const query = `
      SELECT 
        fp.project_id as project_id,
        fp.project_name,
        fp.start_date,
        fp.end_date,
        fp.funding_agency,
        fp.centre,
        fp.project_investigator_id,
        he.employee_name as pi_name,
        pms.status,
        pms.remarks,
        pms.month,
        pms.last_updated_on
      FROM finance_projects fp
      LEFT JOIN hr_employees he ON fp.project_investigator_id = he.employee_id
      LEFT JOIN project_monthly_status pms ON fp.project_id = pms.project_id 
        AND pms.month = $${paramIndex}
      ${whereClause}
      ORDER BY fp.project_name
    `;
    params.push(month || new Date().toISOString().slice(0, 7) + '-01');

    const result = await pool.query(query, params);
    const data = result.rows;

    // Prepare CSV header
    let csv = 'SN,Project,Status,Contact person,Sponsor,Start Date,End Date,Remarks,Last updated on\n';
    // Format date as DD-MM-YYYY
    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB') : '';

    data.forEach((row: any, idx: number) => {
      csv += [
        idx + 1,
        '"' + (row.project_name || '').replace(/"/g, '""') + '"',
        row.status || '',
        row.pi_name || '',
        row.funding_agency || '',
        formatDate(row.start_date),
        formatDate(row.end_date),
        '"' + (row.remarks || '').replace(/"/g, '""').replace(/\n/g, ' ') + '"',
        formatDate(row.last_updated_on)
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="project-status-${month || 'current'}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting project status as CSV:', error);
    res.status(500).json({ error: 'Failed to export project status' });
  }
});

// Export project status as XLSX for a given month
router.get('/export-xlsx', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, group_id } = req.query;
    const user = (req as any).user;

    // Use the same query as the main project status endpoint
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (month) {
      whereClause += ` WHERE fp.start_date <= $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }
    if (group_id && group_id !== 'undefined' && group_id !== '') {
      const operator = whereClause ? 'AND' : 'WHERE';
      whereClause += ` ${operator} fp.group_id = $${paramIndex}`;
      params.push(group_id);
      paramIndex++;
    }

    const query = `
      SELECT 
        fp.project_id as project_id,
        fp.project_name,
        fp.start_date,
        fp.end_date,
        fp.funding_agency,
        fp.centre,
        fp.project_investigator_id,
        he.employee_name as pi_name,
        pms.status,
        pms.remarks,
        pms.month,
        pms.last_updated_on
      FROM finance_projects fp
      LEFT JOIN hr_employees he ON fp.project_investigator_id = he.employee_id
      LEFT JOIN project_monthly_status pms ON fp.project_id = pms.project_id 
        AND pms.month = $${paramIndex}
      ${whereClause}
      ORDER BY fp.project_name
    `;
    params.push(month || new Date().toISOString().slice(0, 7) + '-01');

    const result = await pool.query(query, params);
    const data = result.rows;

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Project Status');

    // Add header row
    const headerRow = worksheet.addRow([
      'SN',
      'Project',
      'Status',
      'Contact person',
      'Sponsor',
      'Start Date',
      'End Date',
      'Remarks',
      'Last updated on'
    ]);
    // Make header row bold
    headerRow.font = { bold: true };

    // Format date as DD-MM-YYYY
    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB') : '';

    // Add data rows with color fill for Status
    data.forEach((row: any, idx: number) => {
      const excelRow = worksheet.addRow([
        idx + 1,
        row.project_name || '',
        row.status || '',
        row.pi_name || '',
        row.funding_agency || '',
        formatDate(row.start_date),
        formatDate(row.end_date),
        (row.remarks || '').replace(/\n/g, ' '),
        formatDate(row.last_updated_on)
      ]);
      // Set fill color for Status cell (3rd column)
      let fillColor = null;
      if (row.status === 'RED') fillColor = 'FF0000';
      if (row.status === 'YELLOW') fillColor = 'FFFF00';
      if (row.status === 'GREEN') fillColor = '00B050';
      if (fillColor) {
        excelRow.getCell(3).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor }
        };
      }
    });

    // Auto width for columns
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="project-status-${month || 'current'}.xlsx"`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting project status as XLSX:', error);
    res.status(500).json({ error: 'Failed to export project status' });
  }
});

export default router; 