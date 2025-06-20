import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import pool from '../db';
import { TalkCreate, TalkUpdate } from '../types/talk';
import { checkRole } from '../middleware/roles';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply role check middleware
const roleCheckMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    checkRole('edofc')(req, res, next);
};
router.use(roleCheckMiddleware);

// Get all talks
const getAllTalks = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM talks ORDER BY talk_date DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching talks:', error);
    res.status(500).json({ message: 'Error fetching talks' });
  }
};

// Get talk by ID
const getTalkById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM talks WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Talk not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching talk:', error);
    res.status(500).json({ message: 'Error fetching talk' });
  }
};

// Create new talk
const createTalk = async (req: Request, res: Response): Promise<void> => {
  try {
    const { speaker_name, topic_role, event_name, venue, talk_date } = req.body;

    // Validate required fields
    if (!speaker_name || !topic_role || !event_name || !venue || !talk_date) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO talks (speaker_name, topic_role, event_name, venue, talk_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [speaker_name, topic_role, event_name, venue, talk_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating talk:', error);
    res.status(500).json({ message: 'Error creating talk' });
  }
};

// Update talk
const updateTalk = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { speaker_name, topic_role, event_name, venue, talk_date } = req.body;

    // Validate required fields
    if (!speaker_name || !topic_role || !event_name || !venue || !talk_date) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const result = await pool.query(
      `UPDATE talks 
       SET speaker_name = $1, topic_role = $2, event_name = $3, venue = $4, talk_date = $5
       WHERE id = $6
       RETURNING *`,
      [speaker_name, topic_role, event_name, venue, talk_date, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Talk not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating talk:', error);
    res.status(500).json({ message: 'Error updating talk' });
  }
};

// Delete talk
const deleteTalk = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM talks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Talk not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting talk:', error);
    res.status(500).json({ message: 'Error deleting talk' });
  }
};

// Register routes
router.get('/', getAllTalks);
router.get('/:id', getTalkById);
router.post('/', createTalk);
router.put('/:id', updateTalk);
router.delete('/:id', deleteTalk);

export default router; 