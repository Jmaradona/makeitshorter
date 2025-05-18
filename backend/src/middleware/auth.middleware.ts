import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';
import { AppError } from './errorHandler.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
      token?: string;
    }
  }
}

export const validateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Unauthorized', 401);
    }

    // Verify JWT token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Add user information to request object
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: data.user.app_metadata?.role
    };
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

// Optional auth middleware - allows requests without auth but adds user if present
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(); // Continue without user
    }

    // Verify JWT token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && data.user) {
      // Add user information to request object
      req.user = {
        id: data.user.id,
        email: data.user.email || '',
        role: data.user.app_metadata?.role
      };
      req.token = token;
    }

    next();
  } catch (error) {
    // Just continue without user info on error
    next();
  }
};