import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role?: string;
        group_id?: number | null;
        employee_id?: number;
        [key: string]: any;
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ error: 'Access token is required' });
            return;
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err: any, decoded: any) => {
            if (err) {
                res.status(403).json({ error: 'Invalid or expired token' });
                return;
            }

            try {
                // Get user details
                const userResult = await pool.query(
                    `SELECT id, username, role
                     FROM users
                     WHERE id = $1`,
                    [decoded.userId]
                );

                if (userResult.rows.length === 0) {
                    res.status(401).json({ error: 'User not found' });
                    return;
                }

                const userData = userResult.rows[0];
                req.user = {
                    id: userData.id,
                    username: userData.username,
                    role: userData.role
                };

                // Get group_id by matching username with technical group name
                const groupResult = await pool.query(
                    `SELECT group_id 
                     FROM technical_groups 
                     WHERE LOWER(group_name) = LOWER($1)`,
                    [userData.username]
                );

                if (groupResult.rows.length > 0) {
                    req.user.group_id = groupResult.rows[0].group_id;
                } else {
                    req.user.group_id = null;
                }

                next();
            } catch (error) {
                console.error('Error fetching user details:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 