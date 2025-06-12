import express, { Request, Response } from 'express';
import db from '../db';
import dayjs from 'dayjs';

const router = express.Router();

// Get all events (no user_id)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      'SELECT * FROM calendar_events ORDER BY start_time'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events-test123' });
  }
});

// Add new event (no user_id)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { title, description, meeting_link, start_time, end_time, venue, reminder_minutes } = req.body;
  if (!title || !start_time || !end_time) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  try {
    const result = await db.query(
      `INSERT INTO calendar_events (title, description, meeting_link, start_time, end_time, venue, reminder_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, meeting_link, start_time, end_time, venue, reminder_minutes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add event' });
  }
});

// Edit event (no user_id)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const event_id = req.params.id;
  const { title, description, meeting_link, start_time, end_time, venue, reminder_minutes } = req.body;
  try {
    const result = await db.query(
      `UPDATE calendar_events SET title=$1, description=$2, meeting_link=$3, start_time=$4, end_time=$5, venue=$6, reminder_minutes=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [title, description, meeting_link, start_time, end_time, venue, reminder_minutes, event_id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (no user_id)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const event_id = req.params.id;
  try {
    const result = await db.query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [event_id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router; 