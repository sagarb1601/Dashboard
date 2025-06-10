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

    const result = await pool.query(
      `INSERT INTO project_events 
       (project_id, event_type, title, start_date, end_date, participants_count, venue)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [project_id, event_type, title, start_date, end_date, participants_count, venue]
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
      event_type,
      title,
      start_date,
      end_date,
      participants_count,
      venue
    } = req.body;

    const result = await pool.query(
      `UPDATE project_events 
       SET event_type = $1,
           title = $2,
           start_date = $3,
           end_date = $4,
           participants_count = $5,
           venue = $6
       WHERE event_id = $7
       RETURNING *`,
      [event_type, title, start_date, end_date, participants_count, venue, eventId]
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