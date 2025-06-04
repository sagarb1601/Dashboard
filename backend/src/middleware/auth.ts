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
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ error: 'Access token is required' });
            return;
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, decoded: any) => {
            if (err) {
                res.status(403).json({ error: 'Invalid or expired token' });
                return;
            }

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