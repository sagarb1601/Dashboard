import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './auth';

export const checkRole = (role: string): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;
        
        if (!user || !user.role || user.role.toLowerCase() !== role.toLowerCase()) {
            res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.' 
            });
            return; // Stop further execution
        }
        
        next();
    };
}; 