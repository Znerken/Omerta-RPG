import { Express, Request, Response, NextFunction } from 'express';
import { validateAuthHeader } from './supabase';
import { storage } from './storage-supabase';

// Extend Express Request type to include user data
declare global {
    namespace Express {
        interface Request {
            user?: any;
            supabaseUser?: any;
        }
    }
}

/**
 * Setup auth routes for Supabase auth
 * @param app Express app
 */
export function setupAuthRoutes(app: Express) {
    // Middleware to check authentication on all API routes
    app.use(async (req: Request, res: Response, next: NextFunction) => {
        // Skip auth for non-API routes or public routes
        if (!req.path.startsWith('/api') || 
            req.path === '/api/check-username-email' || 
            req.path === '/api/register' ||
            req.path.startsWith('/api/public')) {
            return next();
        }

        // Get authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }

        // Validate token
        const supabaseUser = await validateAuthHeader(authHeader);
        if (!supabaseUser) {
            return next();
        }

        // Get user from database
        req.supabaseUser = supabaseUser;
        const user = await storage.getUserBySupabaseId(supabaseUser.id);
        
        if (user) {
            req.user = user;
        }

        next();
    });

    // Current user endpoint
    app.use('/api/user', authProtected, (req: Request, res: Response) => {
        res.json(req.user);
    });

    // Check if username or email is available
    app.post('/api/check-username-email', async (req: Request, res: Response) => {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: 'Username and email are required' });
        }

        // Check if username exists
        const userByUsername = await storage.getUserByUsername(username);
        if (userByUsername) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Check if email exists
        const userByEmail = await storage.getUserByEmail(email);
        if (userByEmail) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        res.status(200).json({ message: 'Username and email are available' });
    });

    // Register endpoint
    app.post('/api/register', async (req: Request, res: Response) => {
        const { username, email, password, confirmPassword, supabaseId } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        try {
            // Check if username exists
            const userByUsername = await storage.getUserByUsername(username);
            if (userByUsername) {
                return res.status(400).json({ message: 'Username is already taken' });
            }

            // Check if email exists
            const userByEmail = await storage.getUserByEmail(email);
            if (userByEmail) {
                return res.status(400).json({ message: 'Email is already registered' });
            }

            // Create user in database
            const newUser = await storage.createUser({
                username,
                email,
                password: 'SUPABASE_AUTH', // Dummy password, auth is handled by Supabase
                level: 1,
                xp: 0,
                cash: 1000, // Starting cash
                respect: 0,
                supabaseId, // Link to Supabase auth
                createdAt: new Date(),
                isAdmin: false,
                isJailed: false,
                isBanned: false,
                status: 'online',
                lastSeen: new Date()
            });

            res.status(201).json(newUser);
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Failed to register user' });
        }
    });
}

/**
 * Middleware to ensure user is authenticated
 */
export function authProtected(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    next();
}

/**
 * Middleware to ensure user is an admin
 */
export function adminProtected(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
    }
    
    next();
}

/**
 * Middleware to redirect jailed users
 */
export function jailProtected(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.isJailed) {
        return res.status(403).json({ 
            message: 'You are currently in jail',
            jailTimeEnd: req.user.jailTimeEnd,
            jailReason: req.user.jailReason
        });
    }
    
    next();
}

/**
 * Check if a username or email is available
 */
export async function checkUsernameEmail(username: string, email: string): Promise<boolean> {
    // Check if username exists
    const userByUsername = await storage.getUserByUsername(username);
    if (userByUsername) {
        return false;
    }
    
    // Check if email exists
    const userByEmail = await storage.getUserByEmail(email);
    if (userByEmail) {
        return false;
    }
    
    return true;
}