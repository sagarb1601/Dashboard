import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

console.log('Project Events router initialized');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all events
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('GET /api/project-events/ route handler called');
  console.log('Request headers:', req.headers);
  
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { username } = req.user;
    console.log('User requesting events:', username);

    const result = await pool.query(
      `SELECT pe.*, fp.project_name 
       FROM project_events pe
       JOIN finance_projects fp ON pe.project_id = fp.project_id
       JOIN technical_groups tg ON fp.group_id = tg.group_id
       WHERE LOWER(tg.group_name) = LOWER($1)
       ORDER BY pe.start_date DESC`,
      [username]
    );
    
    console.log('Events query executed successfully, row count:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /api/project-events/:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get events for a specific project
router.get('/project/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM project_events 
       WHERE project_id = $1 
       ORDER BY start_date DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create new event
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      project_id,
      event_type,
      title,
      start_date,
      end_date,
      participants_count,
      venue
    } = req.body;

    // Get the group_id from the selected project
    const projectResult = await pool.query(
      'SELECT group_id FROM finance_projects WHERE project_id = $1',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const group_id = projectResult.rows[0].group_id;

    const result = await pool.query(
      `INSERT INTO project_events 
       (project_id, group_id, event_type, title, start_date, end_date, participants_count, venue)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [project_id, group_id, event_type, title, start_date, end_date, participants_count, venue]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:eventId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const {
      project_id,
      event_type,
      title,
      start_date,
      end_date,
      participants_count,
      venue
    } = req.body;

    // Get the group_id from the selected project
    const projectResult = await pool.query(
      'SELECT group_id FROM finance_projects WHERE project_id = $1',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const group_id = projectResult.rows[0].group_id;

    const result = await pool.query(
      `UPDATE project_events 
       SET project_id = $1,
           group_id = $2,
           event_type = $3,
           title = $4,
           start_date = $5,
           end_date = $6,
           participants_count = $7,
           venue = $8
       WHERE event_id = $9
       RETURNING *`,
      [project_id, group_id, event_type, title, start_date, end_date, participants_count, venue, eventId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:eventId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(
      'DELETE FROM project_events WHERE event_id = $1 RETURNING *',
      [eventId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router; 