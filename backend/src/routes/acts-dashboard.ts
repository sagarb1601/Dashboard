import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Get ACTS dashboard summary
router.get('/summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/summary - Fetching ACTS summary');

    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT course_name) as total_courses,
        SUM(students_enrolled) as total_students_enrolled,
        SUM(students_placed) as total_students_placed,
        SUM(students_enrolled * course_fee) as total_revenue,
        ROUND(
          CASE 
            WHEN SUM(students_enrolled) > 0 
            THEN (SUM(students_placed)::DECIMAL / SUM(students_enrolled)::DECIMAL) * 100 
            ELSE 0 
          END, 2
        ) as overall_placement_rate
      FROM acts_course
    `);

    console.log('Raw database result:', result.rows[0]);

    const summary = {
      total_courses: parseInt(result.rows[0]?.total_courses || '0'),
      total_students_enrolled: parseInt(result.rows[0]?.total_students_enrolled || '0'),
      total_students_placed: parseInt(result.rows[0]?.total_students_placed || '0'),
      total_revenue: parseFloat(result.rows[0]?.total_revenue || '0'),
      overall_placement_rate: parseFloat(result.rows[0]?.overall_placement_rate || '0')
    };

    console.log('ACTS summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching ACTS summary:', error);
    res.status(500).json({ error: 'Failed to fetch ACTS summary' });
  }
});

// Get student enrollment by course (year-wise)
router.get('/enrollment-by-course', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/enrollment-by-course - Fetching enrollment by course (year-wise)');

    const result = await pool.query(`
      SELECT 
        course_name,
        year,
        students_enrolled as total_enrolled
      FROM acts_course
      ORDER BY year DESC, students_enrolled DESC
    `);

    const data = result.rows.map(row => ({
      course_name: `${row.course_name} (${row.year})`,
      total_enrolled: parseInt(row.total_enrolled)
    }));

    console.log('Enrollment by course (year-wise):', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching enrollment by course:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment by course' });
  }
});

// Get placement rate by course
router.get('/placement-by-course', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/placement-by-course - Fetching placement by course');

    const result = await pool.query(`
      SELECT 
        course_name,
        SUM(students_enrolled) as total_enrolled,
        SUM(students_placed) as total_placed,
        ROUND(
          CASE 
            WHEN SUM(students_enrolled) > 0 
            THEN (SUM(students_placed)::DECIMAL / SUM(students_enrolled)::DECIMAL) * 100 
            ELSE 0 
          END, 2
        ) as placement_rate
      FROM acts_course
      GROUP BY course_name
      ORDER BY placement_rate DESC
    `);

    const data = result.rows.map(row => ({
      course_name: row.course_name,
      total_enrolled: parseInt(row.total_enrolled),
      total_placed: parseInt(row.total_placed),
      placement_rate: parseFloat(row.placement_rate)
    }));

    console.log('Placement by course:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching placement by course:', error);
    res.status(500).json({ error: 'Failed to fetch placement by course' });
  }
});

// Get revenue by course (year-wise)
router.get('/revenue-by-course', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/revenue-by-course - Fetching revenue by course (year-wise)');

    const result = await pool.query(`
      SELECT 
        course_name,
        year,
        (students_enrolled * course_fee) as total_revenue
      FROM acts_course
      ORDER BY year DESC, total_revenue DESC
    `);

    const data = result.rows.map(row => ({
      course_name: `${row.course_name} (${row.year})`,
      total_revenue: parseFloat(row.total_revenue)
    }));

    console.log('Revenue by course (year-wise):', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching revenue by course:', error);
    res.status(500).json({ error: 'Failed to fetch revenue by course' });
  }
});

// Get enrollment trends by year
router.get('/enrollment-trends', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/enrollment-trends - Fetching enrollment trends');

    const result = await pool.query(`
      SELECT 
        year,
        SUM(students_enrolled) as total_enrolled,
        SUM(students_placed) as total_placed,
        ROUND(
          CASE 
            WHEN SUM(students_enrolled) > 0 
            THEN (SUM(students_placed)::DECIMAL / SUM(students_enrolled)::DECIMAL) * 100 
            ELSE 0 
          END, 2
        ) as placement_rate
      FROM acts_course
      GROUP BY year
      ORDER BY year
    `);

    const data = result.rows.map(row => ({
      year: parseInt(row.year),
      total_enrolled: parseInt(row.total_enrolled),
      total_placed: parseInt(row.total_placed),
      placement_rate: parseFloat(row.placement_rate)
    }));

    console.log('Enrollment trends:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching enrollment trends:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment trends' });
  }
});

// Get revenue trends by year
router.get('/revenue-trends', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/revenue-trends - Fetching revenue trends');

    const result = await pool.query(`
      SELECT 
        year,
        SUM(students_enrolled * course_fee) as total_revenue,
        AVG(course_fee) as avg_course_fee
      FROM acts_course
      GROUP BY year
      ORDER BY year
    `);

    const data = result.rows.map(row => ({
      year: parseInt(row.year),
      total_revenue: parseFloat(row.total_revenue),
      avg_course_fee: parseFloat(row.avg_course_fee)
    }));

    console.log('Revenue trends:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trends' });
  }
});

// Get batch performance comparison
router.get('/batch-performance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/batch-performance - Fetching batch performance');

    const result = await pool.query(`
      SELECT 
        batch_name,
        batch_id,
        course_name,
        students_enrolled,
        students_placed,
        course_fee,
        ROUND(
          CASE 
            WHEN students_enrolled > 0 
            THEN (students_placed::DECIMAL / students_enrolled::DECIMAL) * 100 
            ELSE 0 
          END, 2
        ) as placement_rate
      FROM acts_course
      ORDER BY placement_rate DESC
    `);

    const data = result.rows.map(row => ({
      batch_name: row.batch_name,
      batch_id: row.batch_id,
      course_name: row.course_name,
      students_enrolled: parseInt(row.students_enrolled),
      students_placed: parseInt(row.students_placed),
      course_fee: parseFloat(row.course_fee || 0),
      placement_rate: parseFloat(row.placement_rate)
    }));

    console.log('Batch performance:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching batch performance:', error);
    res.status(500).json({ error: 'Failed to fetch batch performance' });
  }
});

// Get batch size distribution
router.get('/batch-size-distribution', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/batch-size-distribution - Fetching batch size distribution');

    const result = await pool.query(`
      SELECT 
        batch_name,
        students_enrolled as batch_size
      FROM acts_course
      ORDER BY students_enrolled DESC
    `);

    console.log('Raw batch size data:', result.rows);

    const data = result.rows.map(row => ({
      batch_name: row.batch_name,
      batch_size: parseInt(row.batch_size)
    }));

    console.log('Batch size distribution:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching batch size distribution:', error);
    res.status(500).json({ error: 'Failed to fetch batch size distribution' });
  }
});

// Get top performing courses
router.get('/top-performing-courses', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/top-performing-courses - Fetching top performing courses');

    const result = await pool.query(`
      SELECT 
        course_name,
        SUM(students_enrolled) as total_enrolled,
        SUM(students_placed) as total_placed,
        ROUND(
          CASE 
            WHEN SUM(students_enrolled) > 0 
            THEN (SUM(students_placed)::DECIMAL / SUM(students_enrolled)::DECIMAL) * 100 
            ELSE 0 
          END, 2
        ) as placement_rate,
        SUM(students_enrolled * course_fee) as total_revenue
      FROM acts_course
      GROUP BY course_name
      ORDER BY placement_rate DESC
      LIMIT 10
    `);

    const data = result.rows.map(row => ({
      course_name: row.course_name,
      total_enrolled: parseInt(row.total_enrolled),
      total_placed: parseInt(row.total_placed),
      placement_rate: parseFloat(row.placement_rate),
      total_revenue: parseFloat(row.total_revenue)
    }));

    console.log('Top performing courses:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching top performing courses:', error);
    res.status(500).json({ error: 'Failed to fetch top performing courses' });
  }
});

// Get enrollments over time with filters
router.get('/enrollments-over-time', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /acts/dashboard/enrollments-over-time - Fetching enrollments over time');
    
    const { course_name, batch_type } = req.query;
    
    console.log('Query parameters:', { course_name, batch_type });
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (course_name) {
      whereClause += ` WHERE course_name = $${paramIndex}`;
      params.push(course_name);
      paramIndex++;
    }

    if (batch_type) {
      const operator = whereClause ? 'AND' : 'WHERE';
      // Fix the batch type filtering to match actual batch_id patterns
      if (batch_type === 'February') {
        whereClause += ` ${operator} batch_id ILIKE $${paramIndex}`;
        params.push('%feb%');
      } else if (batch_type === 'August') {
        whereClause += ` ${operator} batch_id ILIKE $${paramIndex}`;
        params.push('%aug%');
      }
    }

    const query = `
      SELECT 
        year,
        batch_type,
        total_enrolled,
        batch_count
      FROM (
        SELECT 
          year,
          CASE 
            WHEN batch_id ILIKE '%feb%' THEN 'February'
            WHEN batch_id ILIKE '%aug%' THEN 'August'
            ELSE 'Other'
          END as batch_type,
          SUM(students_enrolled) as total_enrolled,
          COUNT(*) as batch_count
        FROM acts_course
        ${whereClause}
        GROUP BY year, 
          CASE 
            WHEN batch_id ILIKE '%feb%' THEN 'February'
            WHEN batch_id ILIKE '%aug%' THEN 'August'
            ELSE 'Other'
          END
      ) subquery
      ORDER BY year ASC, 
        CASE 
          WHEN batch_type = 'February' THEN 1
          WHEN batch_type = 'August' THEN 2
          ELSE 3
        END ASC
    `;

    console.log('SQL Query:', query);
    console.log('Query parameters:', params);

    const result = await pool.query(query, params);

    const data = result.rows.map(row => ({
      year: parseInt(row.year),
      batch_type: row.batch_type,
      total_enrolled: parseInt(row.total_enrolled),
      batch_count: parseInt(row.batch_count),
      time_label: `${row.batch_type} ${row.year}`
    }));

    console.log('Enrollments over time:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching enrollments over time:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments over time' });
  }
});

export default router; 