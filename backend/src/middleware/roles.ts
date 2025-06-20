import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const checkRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        
        if (!user || !user.role || user.role.toLowerCase() !== role.toLowerCase()) {
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.' 
            });
        }
        
        next();
    };
}; 