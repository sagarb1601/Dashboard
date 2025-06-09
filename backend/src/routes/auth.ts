import express, { Request, Response } from 'express';
import pool from '../db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface DatabaseError extends Error {
    code?: string;
    message: string;
}

const router = express.Router();

// Login route
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Login Request Debug ===');
        console.log('1. Request body:', { 
            username: req.body.username,
            passwordLength: req.body.password ? req.body.password.length : 0
        });

        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            console.log('2. Validation failed - missing credentials');
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }

        // First check if the users table exists
        console.log('3. Checking users table existence');
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('4. Users table does not exist');
            res.status(500).json({ error: 'Database not properly initialized' });
            return;
        }
        console.log('4. Users table exists');

        // Get user with password hash
        console.log('5. Querying for user:', username);
        const result = await pool.query(
            'SELECT id, username, role, password_hash FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            console.log('6. User not found in database');
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        console.log('6. User found in database');

        const user = result.rows[0];
        console.log('7. Retrieved user data:', { 
            id: user.id,
            username: user.username,
            role: user.role,
            hasPasswordHash: !!user.password_hash
        });
        
        // Verify password using bcrypt
        console.log('8. Attempting password verification');
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('9. Password verification result:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('10. Password verification failed');
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        console.log('10. Password verified successfully');

        // Generate JWT token
        console.log('11. Generating JWT token');
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
            { expiresIn: '24h' }
        );

        // Send response with CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        console.log('12. Sending successful response');
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
        console.log('=== Login Request Complete ===');
    } catch (error) {
        const dbError = error as DatabaseError;
        console.error('Login error:', {
            message: dbError.message,
            code: dbError.code,
            stack: dbError.stack
        });
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
    }
});

// Register route
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, role } = req.body;

        // Validate input
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }

        console.log('Attempting to register new user:', username);

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT 1 FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            console.log('User already exists:', username);
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        // Hash password with bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user with bcrypt hashed password
        const result = await pool.query(`
            INSERT INTO users (username, password_hash, role)
            VALUES ($1, $2, $3)
            RETURNING id, username, role`,
            [username, hashedPassword, role || 'user']
        );

        const newUser = result.rows[0];
        console.log('New user registered successfully:', username);

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username, role: newUser.role },
            process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 