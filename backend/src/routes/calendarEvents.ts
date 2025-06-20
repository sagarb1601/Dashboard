import express, { Request, Response } from 'express';
import db from '../db';
import dayjs from 'dayjs';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all events
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (!authReq.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const result = await db.query(
      'SELECT * FROM calendar_events ORDER BY start_time'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Add new event
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { 
    title, 
    description, 
    meeting_link, 
    start_time, 
    end_time, 
    venue, 
    reminder_minutes, 
    event_type 
  } = req.body;

  if (!title || !start_time || !end_time || !event_type) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const result = await db.query(
      `INSERT INTO calendar_events (
        title, description, meeting_link, start_time, end_time, 
        venue, reminder_minutes, event_type, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        title, description, meeting_link, start_time, end_time, 
        venue, reminder_minutes, event_type, authReq.user.username
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ error: 'Failed to add event' });
  }
});

// Edit event
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const event_id = req.params.id;
  const { 
    title, 
    description, 
    meeting_link, 
    start_time, 
    end_time, 
    venue, 
    reminder_minutes, 
    event_type 
  } = req.body;

  if (!title || !start_time || !end_time || !event_type) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const result = await db.query(
      `UPDATE calendar_events 
       SET title=$1, description=$2, meeting_link=$3, start_time=$4, end_time=$5, 
           venue=$6, reminder_minutes=$7, event_type=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, description, meeting_link, start_time, end_time, venue, reminder_minutes, event_type, event_id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Update event attendance status
router.patch('/:id/attendance', async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const event_id = req.params.id;
  const { attendance_status, remarks } = req.body;

  if (!attendance_status) {
    res.status(400).json({ error: 'Attendance status is required' });
    return;
  }

  try {
    const result = await db.query(
      `UPDATE calendar_events 
       SET ed_attendance_status=$1, ed_attendance_remarks=$2, ed_attendance_updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [attendance_status, remarks, event_id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Delete event
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const event_id = req.params.id;
  try {
    const result = await db.query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [event_id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router; 