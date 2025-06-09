import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: {
        userId: number;
        username: string;
        role: string;
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('Auth middleware called for path:', req.path);
        const authHeader = req.headers['authorization'];
        console.log('Auth header:', authHeader);
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            console.log('No token provided');
            res.status(401).json({ error: 'Access token is required' });
            return;
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production', (err: any, decoded: any) => {
            if (err) {
                console.log('Token verification failed:', err);
                res.status(403).json({ error: 'Invalid or expired token' });
                return;
            }

            console.log('Token verified successfully, decoded:', decoded);
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role
            };
            
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 